/** Normalização da linha digitada no Claude Code para a gramática do Copiloto (ADR-016). */
const CHAVES = ['dod', 'data', 'peso', 'depende', 'evidencia', 'sprint', 'programa', 'formato', 'para', 'epic', 'instancia', 'area'];

/**
 * Linha digitada no Claude Code → (linha do comando, payload). Aceita o payload inline
 * ("/fila editorial X dod: pronto data: 2026-10-06") além de linhas separadas — é o mesmo formato
 * "chave: valor" que o e-mail usava. Em /criar-* o payload é a definição crua.
 */
export function normalizarEntrada(linhaBruta: string, payload = ''): { linha: string; payload: string[] } {
	let linha = linhaBruta.trim();
	if (!linha.startsWith('/')) linha = `/${linha}`;
	const [primeira, ...resto] = linha.split('\n');
	linha = primeira.trim();
	const extras = [...resto];
	if (!/^\/criar-/i.test(linha)) {
		const re = new RegExp(`\\s(${CHAVES.join('|')}):\\s*`, 'gi');
		const cortes = [...linha.matchAll(re)].filter((m) => (linha.slice(0, m.index).match(/"/g)?.length ?? 0) % 2 === 0);
		if (cortes.length) {
			const inicio = cortes[0].index!;
			const trechos = cortes.map((m, i) => `${m[1].toLowerCase()}: ${linha.slice(m.index! + m[0].length, cortes[i + 1]?.index ?? linha.length).trim()}`);
			linha = linha.slice(0, inicio).trim();
			extras.unshift(...trechos);
		}
	}
	return { linha, payload: [...extras, ...(payload ? payload.split('\n') : [])] };
}
