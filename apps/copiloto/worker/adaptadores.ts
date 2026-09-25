/**
 * Portas de saída/entrada externas (ADR-015 §5.4). O núcleo não conhece SDKs: cada adapter é
 * um fetch estreito, com a credencial só em secrets do Worker.
 *  - Resend: envio (resposta de comando, report HTML ou PDF anexo). DEC-04 emendado.
 *  - Microsoft Graph: entrada de comandos pela caixa Outlook dedicada (subscription + leitura).
 *  - Browser Rendering: PDF A4 do template de impressão.
 *  - Google Sheets: espelho unidirecional do GitHub (DEC-02).
 */
const b64url = (dados: Uint8Array | string) =>
	btoa(typeof dados === 'string' ? unescape(encodeURIComponent(dados)) : String.fromCharCode(...dados))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

export function base64(bytes: Uint8Array): string {
	let s = '';
	for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(s);
}

async function assinarRs256(pem: string, cabecalho: Record<string, unknown>, corpo: Record<string, unknown>): Promise<string> {
	const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
	const chave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	const base = `${b64url(JSON.stringify(cabecalho))}.${b64url(JSON.stringify(corpo))}`;
	const assinatura = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(base)));
	return `${base}.${b64url(assinatura)}`;
}

// ---------------------------------------------------------------- Resend
export interface EnvEmail {
	RESEND_API_KEY?: string;
	EMAIL_FROM: string; // "Copiloto EXECUTAR <copiloto@dominio>"
	EMAIL_ENVIO_ATIVO?: string; // "1" liga o envio real; sem isso, fica só registrado (fail safe)
}

export interface Mensagem {
	para: string[];
	assunto: string;
	html?: string;
	texto: string;
	anexos?: { nome: string; base64: string; tipo?: string }[];
	responderA?: string; // Message-ID do e-mail de comando (mantém o thread)
	idempotencia: string;
}

export class ErroEnvio extends Error {
	definitivo: boolean;
	constructor(mensagem: string, definitivo: boolean) {
		super(mensagem);
		this.definitivo = definitivo;
	}
}

export async function enviarEmail(env: EnvEmail, m: Mensagem, buscar: typeof fetch = fetch): Promise<{ id: string | null; simulado: boolean }> {
	if (env.EMAIL_ENVIO_ATIVO !== '1') return { id: null, simulado: true };
	if (!env.RESEND_API_KEY) throw new ErroEnvio('RESEND_API_KEY não configurada', true);
	const res = await buscar('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': m.idempotencia.slice(0, 256) },
		body: JSON.stringify({
			from: env.EMAIL_FROM,
			to: m.para,
			subject: m.assunto,
			html: m.html,
			text: m.texto,
			attachments: m.anexos?.map((a) => ({ filename: a.nome, content: a.base64, content_type: a.tipo })),
			headers: m.responderA ? { 'In-Reply-To': m.responderA, References: m.responderA } : undefined,
		}),
	});
	if (!res.ok) {
		const texto = (await res.text()).slice(0, 300);
		// 4xx de validação não adianta repetir; 429/5xx sim (§5.7).
		throw new ErroEnvio(`Resend HTTP ${res.status}: ${texto}`, res.status >= 400 && res.status < 500 && res.status !== 429);
	}
	const { id } = (await res.json()) as { id?: string };
	return { id: id ?? null, simulado: false };
}

// ---------------------------------------------------------------- Microsoft Graph (entrada)
export interface EnvGraph {
	GRAPH_TENANT_ID?: string;
	GRAPH_CLIENT_ID?: string;
	GRAPH_CERT_PRIVATE_KEY?: string; // PEM PKCS#8 do certificado da app registration
	GRAPH_CERT_THUMBPRINT?: string; // SHA-1 do certificado em base64url (x5t)
	GRAPH_CLIENT_STATE?: string; // segredo compartilhado da subscription
	GRAPH_MAILBOX: string; // caixa dedicada, ex.: copiloto@dominio
}

export interface EmailRecebido {
	id: string;
	internetMessageId: string;
	remetente: string;
	assunto: string;
	corpo: string;
	dmarc: 'pass' | 'fail' | 'none' | 'unknown';
	anexos: { nome: string; tamanho: number }[];
}

let tokenGraph: { token: string; ate: number } | null = null;

export async function tokenDoGraph(env: EnvGraph, buscar: typeof fetch = fetch): Promise<string> {
	if (tokenGraph && tokenGraph.ate > Date.now() + 60_000) return tokenGraph.token;
	if (!env.GRAPH_TENANT_ID || !env.GRAPH_CLIENT_ID || !env.GRAPH_CERT_PRIVATE_KEY || !env.GRAPH_CERT_THUMBPRINT) throw new Error('Credencial do Microsoft Graph não configurada.');
	const url = `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`;
	const agora = Math.floor(Date.now() / 1000);
	const assercao = await assinarRs256(env.GRAPH_CERT_PRIVATE_KEY, { alg: 'RS256', typ: 'JWT', x5t: env.GRAPH_CERT_THUMBPRINT }, { aud: url, iss: env.GRAPH_CLIENT_ID, sub: env.GRAPH_CLIENT_ID, jti: crypto.randomUUID(), nbf: agora - 60, exp: agora + 540 });
	const res = await buscar(url, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ client_id: env.GRAPH_CLIENT_ID, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer', client_assertion: assercao }),
	});
	if (!res.ok) throw new Error(`Graph token: HTTP ${res.status}`);
	const j = (await res.json()) as { access_token: string; expires_in: number };
	tokenGraph = { token: j.access_token, ate: Date.now() + j.expires_in * 1000 };
	return j.access_token;
}

/** Lê Authentication-Results (DMARC) dos cabeçalhos da mensagem. */
export function dmarcDe(cabecalhos: { name: string; value: string }[]): EmailRecebido['dmarc'] {
	const ar = cabecalhos.filter((h) => h.name.toLowerCase() === 'authentication-results').map((h) => h.value.toLowerCase());
	if (!ar.length) return 'unknown';
	const m = /dmarc=(pass|fail|none|bestguesspass)/.exec(ar.join(';'));
	if (!m) return 'unknown';
	return m[1] === 'pass' ? 'pass' : m[1] === 'bestguesspass' ? 'none' : (m[1] as 'fail' | 'none');
}

export async function lerEmail(env: EnvGraph, id: string, buscar: typeof fetch = fetch): Promise<EmailRecebido> {
	const token = await tokenDoGraph(env, buscar);
	const campos = 'id,internetMessageId,subject,from,body,internetMessageHeaders,hasAttachments';
	const res = await buscar(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.GRAPH_MAILBOX)}/messages/${encodeURIComponent(id)}?$select=${campos}&$expand=attachments($select=name,size)`, {
		headers: { authorization: `Bearer ${token}`, prefer: 'outlook.body-content-type="text"' },
	});
	if (!res.ok) throw new Error(`Graph mensagem: HTTP ${res.status}`);
	const m = (await res.json()) as { id: string; internetMessageId: string; subject?: string; from?: { emailAddress?: { address?: string } }; body?: { content?: string }; internetMessageHeaders?: { name: string; value: string }[]; attachments?: { name: string; size: number }[] };
	return {
		id: m.id,
		internetMessageId: m.internetMessageId,
		remetente: (m.from?.emailAddress?.address ?? '').toLowerCase(),
		assunto: m.subject ?? '',
		corpo: m.body?.content ?? '',
		dmarc: dmarcDe(m.internetMessageHeaders ?? []),
		anexos: (m.attachments ?? []).map((a) => ({ nome: a.name, tamanho: a.size })),
	};
}

/** Cria ou renova a subscription da pasta de entrada (expira; ROT-005 renova). */
export async function renovarAssinatura(env: EnvGraph, urlNotificacao: string, buscar: typeof fetch = fetch, assinaturaId?: string): Promise<{ id: string; expira: string }> {
	const token = await tokenDoGraph(env, buscar);
	const expira = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(); // bem abaixo do máximo do Graph para mensagens
	const base = 'https://graph.microsoft.com/v1.0/subscriptions';
	const res = assinaturaId
		? await buscar(`${base}/${assinaturaId}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ expirationDateTime: expira }) })
		: await buscar(base, {
				method: 'POST',
				headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
				body: JSON.stringify({ changeType: 'created', notificationUrl: urlNotificacao, resource: `users/${env.GRAPH_MAILBOX}/mailFolders('inbox')/messages`, expirationDateTime: expira, clientState: env.GRAPH_CLIENT_STATE }),
			});
	if (!res.ok) throw new Error(`Graph subscription: HTTP ${res.status}`);
	const j = (await res.json()) as { id: string; expirationDateTime: string };
	return { id: j.id, expira: j.expirationDateTime };
}

// ---------------------------------------------------------------- PDF (Browser Run)
export interface Navegador {
	quickAction(acao: 'pdf', opcoes: Record<string, unknown>): Promise<Response>;
}

/**
 * PDF A4 via Browser Run Quick Actions (binding BROWSER, `quickAction("pdf")`, compatibility_date
 * ≥ 2026-03-24). Recebe o HTML pronto do template de impressão e respeita o @page A4 dele.
 */
export async function gerarPdf(browser: Navegador | undefined, html: string): Promise<Uint8Array> {
	if (!browser) throw new ErroEnvio('Browser Run não configurado (binding BROWSER): use formato html.', true);
	const res = await browser.quickAction('pdf', { html, pdfOptions: { format: 'a4', printBackground: true, preferCSSPageSize: true }, gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 } });
	if (!res.ok) throw new ErroEnvio(`PDF: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`, res.status < 500 && res.status !== 429);
	return new Uint8Array(await res.arrayBuffer());
}

// ---------------------------------------------------------------- Google Sheets (espelho)
export interface EnvSheets {
	SHEETS_ID?: string;
	GOOGLE_SA_EMAIL?: string;
	GOOGLE_SA_PRIVATE_KEY?: string;
}

let tokenSheets: { token: string; ate: number } | null = null;

async function tokenGoogle(env: EnvSheets, buscar: typeof fetch): Promise<string> {
	if (tokenSheets && tokenSheets.ate > Date.now() + 60_000) return tokenSheets.token;
	if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) throw new Error('Service account do Google não configurada.');
	const agora = Math.floor(Date.now() / 1000);
	const jwt = await assinarRs256(env.GOOGLE_SA_PRIVATE_KEY, { alg: 'RS256', typ: 'JWT' }, { iss: env.GOOGLE_SA_EMAIL, scope: 'https://www.googleapis.com/auth/spreadsheets', aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600 });
	const res = await buscar('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
	if (!res.ok) throw new Error(`Google token: HTTP ${res.status}`);
	const j = (await res.json()) as { access_token: string; expires_in: number };
	tokenSheets = { token: j.access_token, ate: Date.now() + j.expires_in * 1000 };
	return j.access_token;
}

/** Reescreve abas inteiras (limpa e grava): a planilha é projeção reconstruível, nunca entrada. */
export async function substituirAbas(env: EnvSheets, abas: Record<string, (string | number)[][]>, buscar: typeof fetch = fetch) {
	if (!env.SHEETS_ID) throw new Error('SHEETS_ID não configurado.');
	const token = await tokenGoogle(env, buscar);
	const base = `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEETS_ID}`;
	const h = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
	const nomes = Object.keys(abas);
	const r1 = await buscar(`${base}/values:batchClear`, { method: 'POST', headers: h, body: JSON.stringify({ ranges: nomes.map((n) => `'${n}'`) }) });
	if (!r1.ok) throw new Error(`Sheets clear: HTTP ${r1.status}`);
	const r2 = await buscar(`${base}/values:batchUpdate`, { method: 'POST', headers: h, body: JSON.stringify({ valueInputOption: 'RAW', data: nomes.map((n) => ({ range: `'${n}'!A1`, values: abas[n] })) }) });
	if (!r2.ok) throw new Error(`Sheets update: HTTP ${r2.status}`);
}
