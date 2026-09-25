/**
 * Ledger do Copiloto (D1Like) sobre node:sqlite — substitui o D1 do Worker no plugin (ADR-016).
 * Mesma migration (apps/copiloto/migrations/0001_ledger.sql), mesmas consultas do `Ledger`.
 */
import type { D1Like } from '../../../apps/copiloto/worker/ledger.ts';

interface Banco {
	exec(sql: string): void;
	prepare(sql: string): { run(...v: unknown[]): { changes: number | bigint }; get(...v: unknown[]): unknown; all(...v: unknown[]): unknown[] };
}

export function d1Sqlite(db: Banco, migration: string): D1Like {
	db.exec(migration);
	return {
		prepare(sql) {
			const st = db.prepare(sql);
			return {
				bind: (...v: unknown[]) => ({
					run: async () => ({ meta: { changes: Number(st.run(...v).changes) } }),
					first: async <T>() => (st.get(...v) ?? null) as T | null,
					all: async <T>() => ({ results: st.all(...v) as T[] }),
				}),
			};
		},
	};
}
