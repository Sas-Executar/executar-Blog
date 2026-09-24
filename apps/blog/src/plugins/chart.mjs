// Bloco ```chart em YAML → o mesmo HTML do <Grafico> (ADR-007/ADR-010). O runtime global em
// Head.astro desenha o gráfico. HIG: título e resumo são obrigatórios; sem eles o build falha.
//
// ```chart
// type: bar            # bar | line | scatter | pie
// title: Receita por canal
// summary: Orgânico lidera; eventos são o menor canal.
// x: [Orgânico, Parceiros, Eventos]
// y: [180, 140, 61]
// height: 320          # opcional, em px
// ```
import { parse } from 'yaml';

const TIPOS = ['bar', 'line', 'scatter', 'pie'];
const attr = (s) => String(s).replaceAll('&', '&amp;').replaceAll("'", '&#39;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function opcoes({ type, x = [], y = [] }) {
	if (type === 'pie') return { tooltip: {}, series: [{ type, data: x.map((name, i) => ({ name, value: y[i] })) }] };
	const grid = { left: 8, right: 16, top: 24, bottom: 8, containLabel: true };
	if (type === 'scatter') return { tooltip: {}, grid, xAxis: { type: 'value' }, yAxis: { type: 'value' }, series: [{ type, data: x.map((v, i) => [v, y[i]]) }] };
	return {
		tooltip: {},
		grid,
		xAxis: { type: 'category', data: x, axisLabel: { interval: 0 } },
		yAxis: { type: 'value' },
		series: [{ type, data: y, ...(type === 'bar' ? { itemStyle: { borderRadius: 4 } } : { smooth: true }) }],
	};
}

export function chartHtml(src) {
	const spec = parse(src) ?? {};
	if (!TIPOS.includes(spec.type)) throw new Error(`bloco chart: type deve ser ${TIPOS.join(' | ')}`);
	if (!spec.title || !spec.summary) throw new Error('bloco chart: title e summary são obrigatórios (HIG)');
	const descricao = attr(`${spec.title}. ${spec.summary}`);
	return `<figure class="grafico"><figcaption>${attr(spec.title)}</figcaption><div class="area" style="height:${Number(spec.height) || 320}px" data-grafico='${attr(JSON.stringify(opcoes(spec)))}' data-descricao="${descricao}" role="img" aria-label="${descricao}"></div><p class="resumo">${attr(spec.summary)}</p></figure>`;
}

/**
 * Plugin mdast do Sätteri (processador Markdown padrão do Astro 7): troca o nó `code` do bloco chart.
 * @returns {import('satteri').MdastPluginDefinition}
 */
export default function chartPlugin() {
	return {
		name: 'executar-chart',
		code(node) {
			if (node.lang === 'chart') return { type: /** @type {const} */ ('html'), value: chartHtml(node.value) };
		},
	};
}
