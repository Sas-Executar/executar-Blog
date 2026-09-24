/**
 * Cliente do Studio. Preview e validação rodam no navegador com o MESMO renderer do blog
 * (Sätteri em WebAssembly). Tudo que toca o GitHub passa pelo Worker (/api/*): nenhuma
 * credencial chega aqui. Rascunhos locais ficam no localStorage (conveniência por navegador).
 */
import { z } from 'zod';
import { validarArtigo } from '@executar/content-schema';
import { criarIndice } from '@executar/markdown-parser';
import { gerarEpub, renderMarkdown } from '@executar/editorial-renderer';
import { contarPalavras, definirPropriedade } from './frontmatter.ts';
import { iniciarEditorial, iniciarGraficos, iniciarMermaid, retemarizarGraficos } from '@executar/ui';

type Arquivo = { caminho: string; conteudo: string };
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const MODELO = `---\ntitle: Novo artigo\ndescription: Uma frase que resume o artigo.\ntags: []\n---\n\nEscreva aqui.\n`;
const chave = (c: string) => `studio-rascunho:${c}`;
const guardar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const recuperar = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

async function api<T>(caminho: string, init?: RequestInit): Promise<T> {
	const r = await fetch(caminho, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
	const dados = (await r.json().catch(() => ({}))) as { erro?: string; erros?: string[] };
	if (!r.ok && !dados.erros) throw new Error(dados.erro ?? `HTTP ${r.status}`);
	return dados as T;
}

export function iniciarStudio() {
	const editor = $<HTMLTextAreaElement>('markdown');
	const campoCaminho = $<HTMLInputElement>('caminho');
	const preview = $<HTMLElement>('preview');
	const status = $<HTMLElement>('status');
	let indice = criarIndice([]);
	let assets: { nome: string; base64: string }[] = [];
	const imagensLocais = new Map<string, string>();
	let tempo = 0;
	let ultimoHtml = '';

	const urlAsset = (c: string) => imagensLocais.get(c.split('/').pop() ?? c) ?? `/api/imagem?caminho=${encodeURIComponent(c)}`;
	const avisar = (t: string) => { status.textContent = t; };

	async function atualizar() {
		const md = editor.value;
		guardar(chave(campoCaminho.value || 'novo'), md);
		$('contagem').textContent = `${contarPalavras(md)} palavras`;
		try {
			const r = await renderMarkdown(md, { indice, urlAsset });
			ultimoHtml = r.html;
			const titulo = typeof r.dados.title === 'string' ? `<h1>${r.dados.title.replace(/</g, '&lt;')}</h1>` : '';
			preview.innerHTML = titulo + r.html;
			iniciarEditorial(preview);
			iniciarGraficos(preview);
			void iniciarMermaid(preview);
			for (const campo of document.querySelectorAll<HTMLInputElement>('[data-prop]')) {
				if (document.activeElement === campo) continue;
				const v = r.dados[campo.dataset.prop!];
				campo.value = Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v);
			}
			const val = await validarArtigo(md, { z, render: async () => r });
			const lista = (itens: string[], cls: string) => (itens.length ? `<ul class="${cls}">${itens.map((i) => `<li>${i.replace(/</g, '&lt;')}</li>`).join('')}</ul>` : '');
			$('validacao').innerHTML = val.ok && !val.avisos.length ? '<p>Tudo certo.</p>' : lista(val.erros, 'erro') + lista(val.avisos, 'aviso');
		} catch (e) {
			$('validacao').innerHTML = `<p class="erro">O preview falhou: ${String(e instanceof Error ? e.message : e).replace(/</g, '&lt;')}</p>`;
		}
	}
	const agendar = () => { clearTimeout(tempo); tempo = window.setTimeout(atualizar, 250); };

	function abrir(caminho: string, conteudo: string) {
		campoCaminho.value = caminho;
		editor.value = recuperar(chave(caminho)) ?? conteudo;
		assets = [];
		for (const b of document.querySelectorAll('#artigos button')) b.setAttribute('aria-current', String(b.textContent === caminho));
		void atualizar();
	}

	editor.addEventListener('input', agendar);
	editor.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void atualizar(); avisar('Rascunho salvo neste navegador.'); }
		if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i')) {
			e.preventDefault();
			const marca = e.key === 'b' ? '**' : '*';
			const { selectionStart: a, selectionEnd: b, value: v } = editor;
			editor.setRangeText(`${marca}${v.slice(a, b)}${marca}`, a, b, 'end');
			agendar();
		}
	});
	for (const campo of document.querySelectorAll<HTMLInputElement>('[data-prop]')) {
		campo.addEventListener('change', () => {
			const nome = campo.dataset.prop!;
			const valor = nome === 'tags' ? campo.value.split(',').map((t) => t.trim()).filter(Boolean) : campo.value.trim();
			editor.value = definirPropriedade(editor.value, nome, valor);
			agendar();
		});
	}
	$('novo').addEventListener('click', () => abrir('', MODELO));
	$('tema').addEventListener('click', () => {
		const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = t;
		guardar('studio-tema', t);
		void retemarizarGraficos();
		void atualizar();
	});
	$<HTMLInputElement>('imagem').addEventListener('change', async (e) => {
		const arq = (e.target as HTMLInputElement).files?.[0];
		if (!arq) return;
		const base64 = await new Promise<string>((ok) => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(',')[1]); f.readAsDataURL(arq); });
		assets = [...assets.filter((a) => a.nome !== arq.name), { nome: arq.name, base64 }];
		imagensLocais.set(arq.name, URL.createObjectURL(arq));
		editor.setRangeText(`\n![[${arq.name}]]\n`, editor.selectionStart, editor.selectionEnd, 'end');
		void atualizar();
	});

	for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-modo]')) {
		botao.addEventListener('click', async () => {
			const modo = botao.dataset.modo!;
			if (!campoCaminho.value.trim()) { avisar('Informe o arquivo (Pasta/Título.md) antes de publicar.'); campoCaminho.focus(); return; }
			if (modo === 'publish' && !confirm('Publicar na main? O artigo fica público em cerca de 2 minutos.')) return;
			botao.disabled = true;
			avisar('Enviando…');
			try {
				const r = await api<{ ok: boolean; erros?: string[]; url?: string | null; nota?: string; ramo?: string }>('/api/publicar', {
					method: 'POST',
					body: JSON.stringify({ modo, caminho: campoCaminho.value.trim(), markdown: editor.value, assets }),
				});
				if (!r.ok) { avisar(`Não publicado: ${(r.erros ?? []).join(' ')}`); return; }
				status.innerHTML = '';
				status.append(`${r.nota ?? 'Feito.'} `);
				if (r.url) { const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.url; status.append(a); }
				assets = [];
			} catch (e) {
				avisar(`Erro: ${e instanceof Error ? e.message : e}`);
			} finally {
				botao.disabled = false;
			}
		});
	}
	$('pdf').addEventListener('click', () => window.print());
	$('epub').addEventListener('click', () => {
		const titulo = $<HTMLInputElement>('p-title').value || 'artigo';
		const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n');
		const bytes = gerarEpub({ titulo, html: ultimoHtml, css });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/epub+zip' }));
		a.download = `${titulo}.epub`;
		a.click();
	});

	void (async () => {
		abrir('', recuperar(chave('novo')) ?? MODELO);
		try {
			const eu = await api<{ email: string }>('/api/eu');
			$('eu').textContent = eu.email;
			const [{ artigos }, idx] = await Promise.all([api<{ artigos: string[] }>('/api/artigos'), api<{ arquivos: Arquivo[] }>('/api/indice')]);
			indice = criarIndice(idx.arquivos);
			const ul = $('artigos');
			ul.innerHTML = '';
			for (const caminho of artigos) {
				const li = document.createElement('li');
				const b = document.createElement('button');
				b.type = 'button';
				b.textContent = caminho;
				b.addEventListener('click', async () => {
					const r = await api<{ conteudo: string }>(`/api/artigo?caminho=${encodeURIComponent(caminho)}`);
					abrir(caminho, r.conteudo);
				});
				li.append(b);
				ul.append(li);
			}
			void atualizar();
		} catch (e) {
			$('artigos').innerHTML = `<li>${String(e instanceof Error ? e.message : e).replace(/</g, '&lt;')}</li>`;
		}
	})();
}
