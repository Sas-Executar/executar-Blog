// EPUB 3 a partir do mesmo HTML do renderer (ADR-014). Sem dependências: ZIP "stored" (sem
// compressão, válido para EPUB) com CRC-32 próprio — roda no navegador (Studio) e no Node (script).
const enc = new TextEncoder();

const TABELA = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
function crc32(bytes) {
	let c = 0xffffffff;
	for (const b of bytes) c = TABELA[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

/** ZIP sem compressão. @param {{ nome: string, dados: Uint8Array | string }[]} arquivos */
export function zipArmazenado(arquivos) {
	const partes = [];
	const central = [];
	let deslocamento = 0;
	for (const a of arquivos) {
		const nome = enc.encode(a.nome);
		const dados = typeof a.dados === 'string' ? enc.encode(a.dados) : a.dados;
		const crc = crc32(dados);
		const local = new DataView(new ArrayBuffer(30));
		local.setUint32(0, 0x04034b50, true);
		local.setUint16(4, 20, true);
		local.setUint16(6, 0x0800, true); // nomes em UTF-8
		local.setUint32(14, crc, true);
		local.setUint32(18, dados.length, true);
		local.setUint32(22, dados.length, true);
		local.setUint16(26, nome.length, true);
		partes.push(new Uint8Array(local.buffer), nome, dados);
		const cd = new DataView(new ArrayBuffer(46));
		cd.setUint32(0, 0x02014b50, true);
		cd.setUint16(4, 20, true);
		cd.setUint16(6, 20, true);
		cd.setUint16(8, 0x0800, true);
		cd.setUint32(16, crc, true);
		cd.setUint32(20, dados.length, true);
		cd.setUint32(24, dados.length, true);
		cd.setUint16(28, nome.length, true);
		cd.setUint32(42, deslocamento, true);
		central.push(new Uint8Array(cd.buffer), nome);
		deslocamento += 30 + nome.length + dados.length;
	}
	const tamCentral = central.reduce((n, p) => n + p.length, 0);
	const fim = new DataView(new ArrayBuffer(22));
	fim.setUint32(0, 0x06054b50, true);
	fim.setUint16(8, arquivos.length, true);
	fim.setUint16(10, arquivos.length, true);
	fim.setUint32(12, tamCentral, true);
	fim.setUint32(16, deslocamento, true);
	const todas = [...partes, ...central, new Uint8Array(fim.buffer)];
	const saida = new Uint8Array(todas.reduce((n, p) => n + p.length, 0));
	let i = 0;
	for (const p of todas) {
		saida.set(p, i);
		i += p.length;
	}
	return saida;
}

const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const VAZIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const ATRIBUTO = /([^\s=/>"']+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;

/** HTML → XHTML aceitável no EPUB: atributos sempre com valor entre aspas, vazios fechados, sem scripts/iframes. */
export function paraXhtml(html) {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<iframe\b[^>]*?\bsrc="([^"]*)"[^>]*>\s*<\/iframe>/gi, '<p><a href="$1">$1</a></p>')
		.replace(/<([a-zA-Z][\w-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g, (_, tag, attrs) => {
			const lista = [...attrs.matchAll(ATRIBUTO)].map(([, nome, valor]) => {
				if (valor === undefined) return `${nome}="${nome}"`;
				const bruto = /^["']/.test(valor) ? valor.slice(1, -1) : valor;
				return `${nome}="${bruto.replaceAll('"', '&quot;')}"`;
			});
			const t = tag.toLowerCase();
			return `<${t}${lista.length ? ` ${lista.join(' ')}` : ''}${VAZIOS.has(t) ? ' /' : ''}>`;
		})
		.replace(/&nbsp;/g, '&#160;');
}

/**
 * @param {{ titulo: string, autor?: string, idioma?: string, id?: string, html: string, css?: string, data?: string }} livro
 * @returns {Uint8Array} bytes do arquivo .epub
 */
export function gerarEpub({ titulo, autor = 'EXECUTAR', idioma = 'pt-BR', id, html, css = '', data }) {
	const uid = id ?? `urn:executar:${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
	const modificado = (data ?? new Date().toISOString()).replace(/\.\d+Z$/, 'Z');
	const capitulo = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${esc(idioma)}" lang="${esc(idioma)}">
<head><meta charset="UTF-8" /><title>${esc(titulo)}</title><link rel="stylesheet" href="estilo.css" /></head>
<body><article class="markdown-body"><h1>${esc(titulo)}</h1>
${paraXhtml(html)}
</article></body></html>`;
	const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${esc(idioma)}" lang="${esc(idioma)}">
<head><meta charset="UTF-8" /><title>Sumário</title></head>
<body><nav epub:type="toc" id="toc"><h1>Sumário</h1><ol><li><a href="capitulo.xhtml">${esc(titulo)}</a></li></ol></nav></body></html>`;
	const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${esc(idioma)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">${esc(uid)}</dc:identifier>
<dc:title>${esc(titulo)}</dc:title>
<dc:creator>${esc(autor)}</dc:creator>
<dc:language>${esc(idioma)}</dc:language>
<meta property="dcterms:modified">${esc(modificado)}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />
<item id="capitulo" href="capitulo.xhtml" media-type="application/xhtml+xml" />
<item id="estilo" href="estilo.css" media-type="text/css" />
</manifest>
<spine><itemref idref="capitulo" /></spine>
</package>`;
	const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>`;
	return zipArmazenado([
		{ nome: 'mimetype', dados: 'application/epub+zip' }, // primeiro e sem compressão (exigência do EPUB)
		{ nome: 'META-INF/container.xml', dados: container },
		{ nome: 'OEBPS/content.opf', dados: opf },
		{ nome: 'OEBPS/nav.xhtml', dados: nav },
		{ nome: 'OEBPS/capitulo.xhtml', dados: capitulo },
		{ nome: 'OEBPS/estilo.css', dados: css || 'body{font-family:serif;line-height:1.6}' },
	]);
}
