import assert from 'node:assert/strict';
import { test } from 'node:test';
import chartPlugin, { chartHtml } from '../../apps/blog/src/plugins/chart.mjs';

const bloco = 'type: bar\ntitle: Receita por canal\nsummary: Orgânico lidera.\nx: [Orgânico, Eventos]\ny: [180, 61]';

test('bloco chart vira figure com título, resumo e aria-label', () => {
	const html = chartHtml(bloco);
	assert.match(html, /<figcaption>Receita por canal<\/figcaption>/);
	assert.match(html, /aria-label="Receita por canal. Orgânico lidera."/);
	const json = JSON.parse(html.match(/data-grafico='([^']*)'/)[1].replaceAll('&quot;', '"'));
	assert.deepEqual(json.series[0].data, [180, 61]);
});

test('HIG: sem title ou summary o build falha', () => {
	assert.throws(() => chartHtml('type: bar\ntitle: Só título'), /summary/);
	assert.throws(() => chartHtml('type: radar\ntitle: a\nsummary: b'), /type/);
});

test('o plugin troca só blocos chart', () => {
	const plugin = chartPlugin();
	assert.equal(plugin.code({ type: 'code', lang: 'js', value: '1' }), undefined);
	assert.equal(plugin.code({ type: 'code', lang: 'chart', value: bloco }).type, 'html');
});
