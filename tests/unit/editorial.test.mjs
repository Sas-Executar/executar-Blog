// Gramática editorial única (ADR-013): cada sintaxe do Obsidian, as diretivas e a degradação segura.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderMarkdown } from '@executar/editorial-renderer';
import { criarIndice, idDoCaminho } from '@executar/markdown-parser';

const indice = criarIndice([
	{ caminho: 'Pessoa e cognição/Memória prospectiva.md', conteudo: '---\ntitle: Memória prospectiva\naliases: [Lembrar depois]\npilar: P1\n---\n' },
	{ caminho: 'Pessoa e cognição/Fadiga.md', conteudo: '---\ntitle: Fadiga decisória\npilar: P2\n---\n' },
	{ caminho: 'Pessoa e cognição/grafico.png' },
]);
const html = async (md) => (await renderMarkdown(`---\ntitle: T\n---\n${md}`, { indice })).html;

test('slug do caminho igual ao das URLs publicadas', () => {
	assert.equal(idDoCaminho('Pessoa e cognição/Competição pela atenção.md'), 'blog/pessoa-e-cognição/competição-pela-atenção');
});

test('callouts: tipos, título, dobráveis e tipo desconhecido', async () => {
	const h = await html('> [!tip] Minha dica\n> corpo\n\n> [!warning]- Fechado\n> x\n\n> [!danger]+ Aberto\n> y\n\n> [!inventado]\n> z');
	assert.match(h, /<aside class="callout callout--dica" data-callout="tip" aria-label="Minha dica">/);
	assert.match(h, /<details class="callout callout--atencao" data-callout="warning"><summary class="callout__titulo">Fechado<\/summary>/);
	assert.match(h, /<details class="callout callout--perigo" data-callout="danger" open/);
	assert.match(h, /callout--nota" data-callout="inventado"/);
});

test('destaque, comentários (inline e em bloco) e tags', async () => {
	const h = await html('Um ==marcado== e %%segredo%% e #tag.\n\n%%\ncomentário\nde bloco\n%%\n\nFim.');
	assert.match(h, /<mark>marcado<\/mark>/);
	assert.doesNotMatch(h, /segredo|comentário de bloco/);
	assert.match(h, /<span class="tag">#tag<\/span>/);
	assert.match(h, /Fim\./);
});

test('wikilinks: nome, alias, título, bloco e quebrado', async () => {
	const h = await html('[[Memória prospectiva]] [[Lembrar depois|aqui]] [[Fadiga#Causas comuns]] [[Fadiga#^b1]] [[Não existe]]');
	assert.match(h, /href="\/blog\/pessoa-e-cogni%C3%A7%C3%A3o\/mem%C3%B3ria-prospectiva\/" class="wikilink">Memória prospectiva/);
	assert.match(h, /class="wikilink">aqui</);
	assert.match(h, /fadiga\/#causas-comuns"/);
	assert.match(h, /fadiga\/#bloco-b1"/);
	assert.match(h, /wikilink--quebrado[^>]*>Não existe</);
});

test('âncora de bloco, embeds de imagem e de nota', async () => {
	const h = await html('Texto ^abc\n\n![[grafico.png|300]]\n\n![[Memória prospectiva]]\n\n![[sumiu.png]]');
	assert.match(h, /<p id="bloco-abc">Texto<\/p>/);
	assert.match(h, /<img src="Pessoa%20e%20cogni%C3%A7%C3%A3o\/grafico.png" alt="" width="300"/);
	assert.match(h, /class="embed-nota">Memória prospectiva</);
	assert.match(h, /imagem-ausente/);
});

test('tarefas GFM e caixas estendidas do Minimal', async () => {
	const h = await html('- [ ] a\n- [x] b\n- [/] c\n- [!] d');
	assert.match(h, /data-task=" "/);
	assert.match(h, /data-task="x"/);
	assert.match(h, /<li class="task-list-item" data-task="\/"><span class="tarefa__marca" role="img" aria-label="Em andamento">/);
	assert.match(h, /aria-label="Importante"/);
});

test('math (KaTeX), mermaid e notas de rodapé em português', async () => {
	const h = await html('$x^2$\n\n$$\na+b\n$$\n\n```mermaid\nflowchart LR\n A-->B\n```\n\nNota[^1]\n\n[^1]: rodapé');
	assert.match(h, /class="katex"/);
	assert.match(h, /<div class="formula">/);
	assert.match(h, /<pre class="mermaid" data-mermaid>flowchart LR\n A--&gt;B<\/pre>/);
	assert.match(h, /id="footnote-label">Notas</);
});

test('diretivas: tabs, columns, toggle, callout, steps, metric, comparison, quote, figure, toc', async () => {
	const md = [
		'## Um', '## Dois',
		'::toc',
		'::::tabs', ':::tab[A]', 'aa', ':::', ':::tab[B]', 'bb', ':::', '::::',
		'::::columns', ':::column', 'c1', ':::', ':::column', 'c2', ':::', '::::',
		':::toggle[Abrir]', 'oculto', ':::',
		':::callout{type=warning}', 'cuidado', ':::',
		':::steps', '1. um', '2. dois', ':::',
		'::metric{value="42%" label="Queda" delta="-3%"}',
		':::comparison', 'antes', '', '---', '', 'depois', ':::',
		':::quote{autor="Ada"}', 'frase', ':::',
		':::figure{caption="Legenda"}', 'conteúdo', ':::',
	].join('\n');
	const h = await html(md);
	assert.match(h, /<nav class="toc" aria-label="Nesta página">.*href="#um".*href="#dois"/s);
	assert.match(h, /role="tablist".*aria-selected="true"[^>]*>A<.*aria-selected="false"[^>]*>B</s);
	assert.match(h, /role="tabpanel"[^>]*data-ativo/);
	assert.equal((h.match(/data-ativo/g) ?? []).length, 1);
	assert.match(h, /class="colunas" style="--colunas:2"/);
	assert.match(h, /<details class="toggle"><summary>Abrir<\/summary>/);
	assert.match(h, /callout--atencao/);
	assert.match(h, /class="passos"><ol>/);
	assert.match(h, /class="metrica" data-tendencia="baixa"><p class="metrica__valor">42%/);
	assert.match(h, /data-lado="antes".*antes.*data-lado="depois".*depois/s);
	assert.match(h, /<figcaption>— Ada<\/figcaption>/);
	assert.match(h, /<figcaption>Legenda<\/figcaption>/);
});

test('embed: host permitido vira iframe; outro host vira link', async () => {
	const h = await html('::embed{url="https://www.youtube-nocookie.com/embed/x" title="Vídeo"}\n\n::embed{url="https://evil.example/x" title="Outro"}');
	assert.match(h, /<iframe src="https:\/\/www.youtube-nocookie.com\/embed\/x" title="Vídeo"/);
	assert.match(h, /<a href="https:\/\/evil.example\/x">Outro<\/a>/);
	assert.doesNotMatch(h, /<iframe src="https:\/\/evil/);
});

test('database: tabela das notas da pasta com filtro e ordenação', async () => {
	const h = await html('::database{from="Pessoa e cognição" columns="title,pilar" sort="title:desc" filter="pilar=P1"}');
	assert.match(h, /<th scope="col">Título<\/th><th scope="col">pilar<\/th>/);
	assert.match(h, /Memória prospectiva<\/a><\/th><td>P1<\/td>/);
	assert.doesNotMatch(h, /Fadiga/);
});

test('degradação: diretiva desconhecida preserva o conteúdo e avisa', async () => {
	const r = await renderMarkdown('---\ntitle: T\n---\n:::nova-coisa\nconteúdo mantido\n:::', { indice });
	assert.match(r.html, /class="diretiva diretiva--nova-coisa"><p>conteúdo mantido<\/p>/);
	assert.ok(r.avisos.some((a) => a.includes('nova-coisa')));
});
