// Comandos "/" do editor (FR-04): cada um insere um bloco da gramática editorial (EDITORIAL-SYNTAX-SPEC).
export const COMANDOS = [
	{ id: 'callout', rotulo: 'Callout', texto: '> [!tip] Título\n> Conteúdo.\n' },
	{ id: 'tabela', rotulo: 'Tabela', texto: '| Coluna | Coluna |\n|---|---|\n| valor | valor |\n' },
	{ id: 'tarefas', rotulo: 'Lista de tarefas', texto: '- [ ] Tarefa\n- [x] Feita\n' },
	{ id: 'abas', rotulo: 'Abas', texto: '::::tabs\n:::tab[Primeira]\nConteúdo.\n:::\n:::tab[Segunda]\nConteúdo.\n:::\n::::\n' },
	{ id: 'colunas', rotulo: 'Colunas', texto: '::::columns\n:::column\nEsquerda.\n:::\n:::column\nDireita.\n:::\n::::\n' },
	{ id: 'grade', rotulo: 'Grade', texto: ':::grid{cols=3}\n- um\n- dois\n- três\n:::\n' },
	{ id: 'toggle', rotulo: 'Toggle', texto: ':::toggle[Título]\nConteúdo escondido.\n:::\n' },
	{ id: 'codigo', rotulo: 'Código', texto: '```ts\n// código\n```\n' },
	{ id: 'grafico', rotulo: 'Gráfico', texto: '```chart\ntype: bar\ntitle: "Título"\nsummary: "O que o gráfico mostra."\nx: ["A", "B"]\ny: [1, 2]\n```\n' },
	{ id: 'mermaid', rotulo: 'Diagrama Mermaid', texto: '```mermaid\nflowchart LR\n  A --> B\n```\n' },
	{ id: 'embed', rotulo: 'Vídeo (embed)', texto: '::embed{url="https://www.youtube-nocookie.com/embed/ID" title="Título do vídeo"}\n' },
	{ id: 'link', rotulo: 'Link interno', texto: '[[Nome da nota]]' },
	{ id: 'metrica', rotulo: 'Métrica', texto: '::metric{value="42%" label="Rótulo" delta="+5%"}\n' },
	{ id: 'passos', rotulo: 'Passos', texto: ':::steps\n1. Primeiro\n2. Segundo\n:::\n' },
	{ id: 'sumario', rotulo: 'Sumário', texto: '::toc\n' },
];

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filtrarComandos(consulta: string) {
	const q = normalizar(consulta);
	return COMANDOS.filter((c) => normalizar(c.rotulo).includes(q) || c.id.includes(q));
}
