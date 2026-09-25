/**
 * Operational Ledger em D1 (ADR-015, DEC-03 emendado: D1 no lugar do Postgres). Guarda comando,
 * idempotência, confirmação humana, outbox, DLQ e auditoria. Nunca é fonte de tarefa.
 */

/** Subconjunto da API do D1 usado aqui (permite simular em testes). */
export interface D1Like {
	prepare(sql: string): { bind(...v: unknown[]): { run(): Promise<{ meta?: { changes?: number } }>; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results: T[] }> } };
}

const agoraIso = () => new Date().toISOString();

export async function sha256(texto: string): Promise<string> {
	const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
	return [...d].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** ULID simplificado e ordenável (tempo + aleatório, Crockford base32). */
export function ulid(agora = Date.now()): string {
	const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
	let t = '';
	for (let n = agora, i = 0; i < 10; i++, n = Math.floor(n / 32)) t = A[n % 32] + t;
	const r = crypto.getRandomValues(new Uint8Array(16));
	return t + [...r].map((b) => A[b % 32]).join('');
}

export class Ledger {
	private db: D1Like;
	constructor(db: D1Like) {
		this.db = db;
	}

	/** Dedupe na borda: true se o evento é novo. */
	async registrarEvento(source: string, externalId: string, payload?: unknown): Promise<boolean> {
		const r = await this.db.prepare('INSERT OR IGNORE INTO inbound_event (source, external_id, payload, received_at) VALUES (?, ?, ?, ?)').bind(source, externalId, payload === undefined ? null : JSON.stringify(payload), agoraIso()).run();
		return (r.meta?.changes ?? 0) > 0;
	}

	/** Cria o comando; se o dedupe_key já existe, devolve o existente (reenvio idempotente). */
	async abrirComando(c: { command_id: string; dedupe_key: string; source: string; actor: string; verb?: string; envelope: unknown }) {
		const agora = agoraIso();
		const r = await this.db
			.prepare('INSERT OR IGNORE INTO command (command_id, dedupe_key, source, actor, verb, envelope, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
			.bind(c.command_id, c.dedupe_key, c.source, c.actor, c.verb ?? null, JSON.stringify(c.envelope), 'RECEIVED', agora, agora)
			.run();
		if ((r.meta?.changes ?? 0) > 0) return { novo: true, command_id: c.command_id, status: 'RECEIVED' };
		const existente = await this.db.prepare('SELECT command_id, status FROM command WHERE dedupe_key = ?').bind(c.dedupe_key).first<{ command_id: string; status: string }>();
		return { novo: false, command_id: existente?.command_id ?? c.command_id, status: existente?.status ?? 'RECEIVED' };
	}

	async statusComando(commandId: string, status: string, result?: unknown) {
		await this.db.prepare('UPDATE command SET status = ?, result = COALESCE(?, result), attempts = attempts + 1, updated_at = ? WHERE command_id = ?').bind(status, result === undefined ? null : JSON.stringify(result), agoraIso(), commandId).run();
	}

	/** Idempotência por operação: executa `fn` só se a chave ainda não foi aplicada. */
	async operacao<T>(idempotencyKey: string, commandId: string, target: string, fn: () => Promise<T>): Promise<T> {
		const feito = await this.db.prepare('SELECT result FROM operation_log WHERE idempotency_key = ? AND status = ?').bind(idempotencyKey, 'APLICADA').first<{ result: string }>();
		if (feito) return JSON.parse(feito.result) as T;
		const r = await fn();
		await this.db.prepare('INSERT OR REPLACE INTO operation_log (idempotency_key, command_id, target, result, status, at) VALUES (?, ?, ?, ?, ?, ?)').bind(idempotencyKey, commandId, target, JSON.stringify(r ?? null), 'APLICADA', agoraIso()).run();
		return r;
	}

	async evento(entity: string, type: string, before: unknown, after: unknown, commandId?: string) {
		await this.db.prepare('INSERT INTO domain_event (entity, type, before, after, command_id, at) VALUES (?, ?, ?, ?, ?, ?)').bind(entity, type, JSON.stringify(before ?? null), JSON.stringify(after ?? null), commandId ?? null, agoraIso()).run();
	}

	async auditar(actor: string, action: string, target: string | null, commandId?: string) {
		await this.db.prepare('INSERT INTO audit_log (at, actor, action, target, command_id) VALUES (?, ?, ?, ?, ?)').bind(agoraIso(), actor, action, target, commandId ?? null).run();
	}

	/** Plano pendente de confirmação humana: token de 6 caracteres, hash no ledger, 30 min, uso único. */
	async guardarPlano(commandId: string, plano: unknown, validadeMin = 30): Promise<string> {
		const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		const token = [...crypto.getRandomValues(new Uint8Array(6))].map((b) => A[b % A.length]).join('');
		const expira = new Date(Date.now() + validadeMin * 60_000).toISOString();
		await this.db.prepare('INSERT OR REPLACE INTO execution_plan (command_id, plan, confirm_token_hash, expires_at) VALUES (?, ?, ?, ?)').bind(commandId, JSON.stringify(plano), await sha256(token), expira).run();
		return token;
	}

	/** Consome o token: devolve o plano se válido; null se expirado, usado ou inexistente (E-401). */
	async consumirPlano(token: string): Promise<{ command_id: string; plano: unknown } | null> {
		const h = await sha256(token.toUpperCase());
		const p = await this.db.prepare('SELECT command_id, plan, expires_at, used_at FROM execution_plan WHERE confirm_token_hash = ?').bind(h).first<{ command_id: string; plan: string; expires_at: string; used_at: string | null }>();
		if (!p || p.used_at || p.expires_at < agoraIso()) return null;
		const r = await this.db.prepare('UPDATE execution_plan SET used_at = ? WHERE command_id = ? AND used_at IS NULL').bind(agoraIso(), p.command_id).run();
		if (!(r.meta?.changes ?? 0)) return null;
		return { command_id: p.command_id, plano: JSON.parse(p.plan) };
	}

	async enfileirar(destination: string, payload: unknown, commandId?: string): Promise<number> {
		const agora = agoraIso();
		await this.db.prepare('INSERT INTO outbox (command_id, destination, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(commandId ?? null, destination, JSON.stringify(payload), agora, agora).run();
		const r = await this.db.prepare('SELECT MAX(id) AS id FROM outbox').bind().first<{ id: number }>();
		return r?.id ?? 0;
	}

	async outboxPendente(limite = 20) {
		return (await this.db.prepare("SELECT id, command_id, destination, payload, attempts FROM outbox WHERE status = 'PENDENTE' ORDER BY id LIMIT ?").bind(limite).all<{ id: number; command_id: string | null; destination: string; payload: string; attempts: number }>()).results;
	}

	async outboxResultado(id: number, ok: boolean, erro?: string, maxTentativas = 5) {
		if (ok) {
			await this.db.prepare("UPDATE outbox SET status = 'ENVIADO', attempts = attempts + 1, updated_at = ? WHERE id = ?").bind(agoraIso(), id).run();
			return 'ENVIADO';
		}
		const linha = await this.db.prepare('SELECT attempts, payload FROM outbox WHERE id = ?').bind(id).first<{ attempts: number; payload: string }>();
		const tentativas = (linha?.attempts ?? 0) + 1;
		const status = tentativas >= maxTentativas ? 'DLQ' : 'PENDENTE';
		await this.db.prepare('UPDATE outbox SET status = ?, attempts = ?, last_error = ?, updated_at = ? WHERE id = ?').bind(status, tentativas, erro ?? null, agoraIso(), id).run();
		if (status === 'DLQ') await this.db.prepare('INSERT INTO dead_letter (origin, ref, error, last_payload, first_failed_at) VALUES (?, ?, ?, ?, ?)').bind('outbox', String(id), erro ?? 'erro', linha?.payload ?? null, agoraIso()).run();
		return status;
	}

	/** Replay idempotente: devolve o item da DLQ à fila (mesmo payload, mesmo command_id). */
	async replay(outboxId: number) {
		const r = await this.db.prepare("UPDATE outbox SET status = 'PENDENTE', attempts = 0, updated_at = ? WHERE id = ? AND status = 'DLQ'").bind(agoraIso(), outboxId).run();
		if (r.meta?.changes) await this.db.prepare("UPDATE dead_letter SET replayed_at = ? WHERE origin = 'outbox' AND ref = ?").bind(agoraIso(), String(outboxId)).run();
		return Boolean(r.meta?.changes);
	}

	async profundidadeDlq(): Promise<number> {
		return (await this.db.prepare('SELECT COUNT(*) AS n FROM dead_letter WHERE replayed_at IS NULL').bind().first<{ n: number }>())?.n ?? 0;
	}

	/** Rotina já disparada para este horário? Evita duplicar em reexecução de cron. */
	async marcarRotina(routineId: string, horario: string): Promise<boolean> {
		const r = await this.db.prepare('INSERT OR IGNORE INTO schedule_run (routine_id, scheduled_for, status) VALUES (?, ?, ?)').bind(routineId, horario, 'DISPARADA').run();
		return (r.meta?.changes ?? 0) > 0;
	}

	async sincronizado(destination: string, hash: string, drift: number) {
		await this.db.prepare('INSERT OR REPLACE INTO sync_state (destination, last_hash, last_synced_at, drift) VALUES (?, ?, ?, ?)').bind(destination, hash, agoraIso(), drift).run();
	}

	async ultimoSync(destination: string) {
		return this.db.prepare('SELECT last_hash, last_synced_at, drift FROM sync_state WHERE destination = ?').bind(destination).first<{ last_hash: string; last_synced_at: string; drift: number }>();
	}
}
