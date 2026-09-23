// Script pontual: insere um painel ilustrativo (Grafico.astro/ECharts, ADR-007) com dados
// fictícios em cada artigo do vault e no correspondente já gerado em src/content/docs/artigos.
// Uso único (demonstração pedida pelo usuário); não faz parte do pipeline normal de sync.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vaultDir = path.join(root, 'vault');
const docsDir = path.join(root, 'apps/blog/src/content/docs/artigos');

/** @type {Array<{file: string, titulo: string, resumo: string, tipo: 'bar'|'line', categorias: string[], valores: number[]}>} */
const graficos = [
	{
		file: 'Ambiente e contexto/Ambiente digital.md',
		titulo: 'Fricção por tipo de interface (dados fictícios)',
		resumo: 'Esforço percebido (0–100) ao concluir uma tarefa comum, por tipo de interface. Dados ilustrativos, não medidos.',
		tipo: 'bar',
		categorias: ['Notificações', 'Formulários', 'Navegação', 'Permissões'],
		valores: [72, 58, 45, 63],
	},
	{
		file: 'Ambiente e contexto/Ambiente físico e ergonomia.md',
		titulo: 'Queixas por fator ergonômico (dados fictícios)',
		resumo: 'Frequência relativa de queixas por fator do ambiente físico. Dados ilustrativos, não medidos.',
		tipo: 'bar',
		categorias: ['Iluminação', 'Ruído', 'Postura', 'Temperatura'],
		valores: [40, 55, 68, 35],
	},
	{
		file: 'Ambiente e contexto/Rotina hábitos e contexto.md',
		titulo: 'Energia percebida ao longo do dia (dados fictícios)',
		resumo: 'Variação ilustrativa de energia/disposição percebida em quatro janelas do dia. Dados fictícios.',
		tipo: 'line',
		categorias: ['Manhã', 'Meio-dia', 'Tarde', 'Noite'],
		valores: [80, 55, 40, 60],
	},
	{
		file: 'Informação e interface/Agrupamento e segmentação.md',
		titulo: 'Tempo de busca por organização da lista (dados fictícios)',
		resumo: 'Segundos ilustrativos até encontrar um item, conforme a lista ganha agrupamento. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Sem grupo', 'Grupo simples', 'Grupo + rótulo', 'Grupo + busca'],
		valores: [42, 30, 18, 10],
	},
	{
		file: 'Informação e interface/Excesso de opções e padrões manipulativos.md',
		titulo: 'Desistência por número de opções (dados fictícios)',
		resumo: 'Taxa ilustrativa (%) de desistência da tarefa conforme o número de opções apresentadas. Dados fictícios.',
		tipo: 'bar',
		categorias: ['3 opções', '6 opções', '12 opções', '20+ opções'],
		valores: [8, 15, 34, 52],
	},
	{
		file: 'Informação e interface/Forma e visualização da informação.md',
		titulo: 'Erros de leitura por formato (dados fictícios)',
		resumo: 'Taxa ilustrativa (%) de erro de interpretação por formato de apresentação. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Texto corrido', 'Tabela', 'Lista', 'Gráfico'],
		valores: [30, 18, 12, 9],
	},
	{
		file: 'Informação e interface/Quantidade de informação.md',
		titulo: 'Retenção por volume de itens (dados fictícios)',
		resumo: 'Percentual ilustrativo de itens lembrados corretamente conforme a lista cresce. Dados fictícios.',
		tipo: 'bar',
		categorias: ['3 itens', '5 itens', '7 itens', '9+ itens'],
		valores: [92, 81, 63, 44],
	},
	{
		file: 'Pessoa e cognição/Memória prospectiva.md',
		titulo: 'Lembretes concluídos por tipo de apoio (dados fictícios)',
		resumo: 'Percentual ilustrativo de intenções futuras concluídas conforme o apoio disponível. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Sem apoio', 'Alerta único', 'Alerta + contexto', 'Checklist'],
		valores: [38, 55, 74, 86],
	},
	{
		file: 'Pessoa e cognição/Competição pela atenção.md',
		titulo: 'Interrupções por canal (dados fictícios)',
		resumo: 'Número ilustrativo de interrupções por dia, por canal. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Notificação push', 'E-mail', 'Chat', 'Reunião'],
		valores: [24, 12, 31, 9],
	},
	{
		file: 'Pessoa e cognição/Perfil cognitivo do executor.md',
		titulo: 'Barreiras relatadas por tipo (dados fictícios)',
		resumo: 'Distribuição ilustrativa (%) de barreiras relatadas por executores. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Memória', 'Atenção', 'Linguagem', 'Organização'],
		valores: [35, 28, 15, 22],
	},
	{
		file: 'Pessoa e cognição/Fadiga decisória.md',
		titulo: 'Qualidade da decisão ao longo do dia (dados fictícios)',
		resumo: 'Escore ilustrativo (0–100) de qualidade percebida da decisão, por horário. Dados fictícios.',
		tipo: 'line',
		categorias: ['9h', '12h', '15h', '18h'],
		valores: [88, 74, 58, 41],
	},
	{
		file: 'Fatores de Riscos Cognitivos.md',
		titulo: 'Fatores mapeados por grupo (dados fictícios)',
		resumo: 'Contagem ilustrativa de fatores por grupo temático, apenas para demonstrar o painel. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Pessoa e cognição', 'Tarefa e fluxo', 'Informação e interface', 'Ambiente e contexto', 'Sistema e suporte'],
		valores: [4, 5, 4, 3, 4],
	},
	{
		file: 'Sistema e arquitetura de suporte/Cadeia de desvalor para cadeia de valor.md',
		titulo: 'Retrabalho por etapa (dados fictícios)',
		resumo: 'Percentual ilustrativo de retrabalho por etapa do processo. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Entrada', 'Processo', 'Validação', 'Entrega'],
		valores: [20, 35, 15, 8],
	},
	{
		file: 'Sistema e arquitetura de suporte/Sobrecarga cognitiva sistêmica.md',
		titulo: 'Carga percebida por fonte (dados fictícios)',
		resumo: 'Escore ilustrativo (0–100) de carga percebida, por fonte de demanda. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Processos', 'Ferramentas', 'Comunicação', 'Decisões'],
		valores: [45, 38, 52, 41],
	},
	{
		file: 'Sistema e arquitetura de suporte/Externalização cognitiva.md',
		titulo: 'Confiabilidade por forma de registro (dados fictícios)',
		resumo: 'Percentual ilustrativo de recuperação correta da informação, por forma de registro. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Memória', 'Nota simples', 'Checklist', 'Sistema'],
		valores: [40, 62, 81, 93],
	},
	{
		file: 'Sistema e arquitetura de suporte/Tailoring do projeto.md',
		titulo: 'Adequação por nível de tailoring (dados fictícios)',
		resumo: 'Percentual ilustrativo de adequação ao contexto, por nível de tailoring aplicado. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Genérico', 'Adaptado', 'Tailored leve', 'Tailored completo'],
		valores: [30, 55, 74, 88],
	},
	{
		file: 'Tarefa e fluxo de execução/Clareza e escrita da tarefa.md',
		titulo: 'Retrabalho por clareza da tarefa (dados fictícios)',
		resumo: 'Percentual ilustrativo de retrabalho conforme a clareza da escrita da tarefa. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Vaga', 'Parcial', 'Clara', 'Clara + critério'],
		valores: [48, 30, 14, 6],
	},
	{
		file: 'Tarefa e fluxo de execução/Decomposição de tarefas.md',
		titulo: 'Tempo até início por tamanho da tarefa (dados fictícios)',
		resumo: 'Minutos ilustrativos até o início efetivo, conforme a tarefa é decomposta. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Tarefa única grande', 'Dividida em 2', 'Dividida em 4', 'Dividida em 6+'],
		valores: [50, 32, 18, 12],
	},
	{
		file: 'Tarefa e fluxo de execução/Dependências e cadeia de valor.md',
		titulo: 'Bloqueios por número de dependências (dados fictícios)',
		resumo: 'Percentual ilustrativo de bloqueios conforme o número de dependências da tarefa. Dados fictícios.',
		tipo: 'bar',
		categorias: ['0 dependências', '1–2', '3–4', '5+'],
		valores: [5, 18, 34, 57],
	},
	{
		file: 'Tarefa e fluxo de execução/Preparação antes da execução.md',
		titulo: 'Erros por nível de preparação (dados fictícios)',
		resumo: 'Percentual ilustrativo de erros conforme o nível de preparação antes de executar. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Sem preparo', 'Checklist rápido', 'Preparo guiado', 'Preparo + revisão'],
		valores: [44, 27, 15, 9],
	},
	{
		file: 'Tarefa e fluxo de execução/Troca de tarefas.md',
		titulo: 'Custo de retomada por interrupção (dados fictícios)',
		resumo: 'Minutos ilustrativos perdidos até retomar o foco, por duração da interrupção. Dados fictícios.',
		tipo: 'bar',
		categorias: ['Curta (<1min)', 'Média (1–5min)', 'Longa (5–15min)', 'Muito longa (15min+)'],
		valores: [10, 25, 48, 70],
	},
];

function opcoes(g) {
	return {
		tooltip: {},
		grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
		xAxis: { type: 'category', data: g.categorias, axisLabel: { interval: 0, rotate: g.categorias.length > 4 ? 20 : 0 } },
		yAxis: { type: 'value' },
		series: [
			g.tipo === 'line'
				? { type: 'line', data: g.valores, smooth: true, symbolSize: 8 }
				: { type: 'bar', data: g.valores, itemStyle: { borderRadius: 4 } },
		],
	};
}

function blocoHtml(g) {
	const desc = `${g.titulo}. ${g.resumo}`;
	const json = JSON.stringify(opcoes(g)).replace(/'/g, '&#39;');
	return [
		'',
		'## 13. Painel ilustrativo (dados fictícios)',
		'',
		'<figure class="grafico">',
		`\t<figcaption>${g.titulo}</figcaption>`,
		`\t<div class="area" style="height:320px" data-grafico='${json}' data-descricao="${desc}" role="img" aria-label="${desc}"></div>`,
		`\t<p class="resumo">${g.resumo}</p>`,
		'</figure>',
		'',
	].join('\n');
}

function inserir(conteudo, bloco) {
	const marcador = '\n## Relacionados';
	const idx = conteudo.indexOf(marcador);
	if (idx === -1) return conteudo.replace(/\n*$/, '\n') + bloco;
	return conteudo.slice(0, idx) + '\n' + bloco + conteudo.slice(idx);
}

let alterados = 0;
for (const g of graficos) {
	const bloco = blocoHtml(g);
	for (const base of [vaultDir, docsDir]) {
		const p = path.join(base, g.file);
		const atual = readFileSync(p, 'utf8');
		if (atual.includes('Painel ilustrativo (dados fictícios)')) continue; // idempotente
		writeFileSync(p, inserir(atual, bloco));
		alterados++;
	}
}
console.log(`arquivos alterados: ${alterados}`);
