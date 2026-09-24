/**
 * Cliente do Studio. Preview e validação rodam no navegador com o MESMO renderer do blog
 * (Sätteri em WebAssembly). Tudo que toca o GitHub passa pelo Worker (/api/*): nenhuma
 * credencial chega aqui. Rascunhos locais ficam no localStorage (conveniência por navegador).
 */
import { z } from 'zod';
import { validarArtigo } from '@executar/content-schema';
import { criarIndice, idDoCaminho } from '@executar/markdown-parser';
import { gerarEpub, gerarLivroWeb, renderMarkdown } from '@executar/editorial-renderer';
import { contarPalavras, definirPropriedade } from './frontmatter.ts';
import { COMANDOS, filtrarComandos } from './comandos.ts';
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
	let shaOriginal: string | undefined;
	let blog = '';
	let artigos: string[] = [];
	const livro: string[] = [];

	const urlAsset = (c: string) => imagensLocais.get(c.split('/').pop() ?? c) ?? `/api/imagem?caminho=${encodeURIComponent(c)}`;
	const avisar = (t: string) => { status.textContent = t; };

	async function atualizar() {
		const md = editor.value;
		const inicio = performance.now();
		guardar(chave(campoCaminho.value || 'novo'), md);
		const c = campoCaminho.value.trim();
		$('rota').textContent = c.endsWith('.md') ? `Endereço: ${blog}/${idDoCaminho(c)}/` : 'Endereço: informe Pasta/Título.md';
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
			$('tempo-preview').textContent = `preview em ${Math.round(performance.now() - inicio)} ms`;
			const val = await validarArtigo(md, { z, render: async () => r });
			const lista = (itens: string[], cls: string) => (itens.length ? `<ul class="${cls}">${itens.map((i) => `<li>${i.replace(/</g, '&lt;')}</li>`).join('')}</ul>` : '');
			$('validacao').innerHTML = val.ok && !val.avisos.length ? '<p>Tudo certo.</p>' : lista(val.erros, 'erro') + lista(val.avisos, 'aviso');
		} catch (e) {
			$('validacao').innerHTML = `<p class="erro">O preview falhou: ${String(e instanceof Error ? e.message : e).replace(/</g, '&lt;')}</p>`;
		}
	}
	const agendar = () => { clearTimeout(tempo); tempo = window.setTimeout(atualizar, 250); };

	function abrir(caminho: string, conteudo: string, sha?: string) {
		campoCaminho.value = caminho;
		shaOriginal = sha;
		$('historico').innerHTML = '';
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
				const r = await api<{ ok: boolean; erros?: string[]; url?: string | null; nota?: string; ramo?: string; commit?: string; arquivo?: string }>('/api/publicar', {
					method: 'POST',
					body: JSON.stringify({ modo, caminho: campoCaminho.value.trim(), markdown: editor.value, assets, shaOriginal }),
				});
				if (!r.ok) { avisar(`Não publicado: ${(r.erros ?? []).join(' ')}`); return; }
				status.innerHTML = '';
				status.append(`${r.nota ?? 'Feito.'} `);
				if (r.url) { const a = document.createElement('a'); a.href = r.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.url; status.append(a); }
				assets = [];
				if (modo === 'publish' && r.arquivo) shaOriginal = r.arquivo;
				if (r.commit) void acompanharBuild(r.commit);
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

	/** FR-11: acompanha os check runs do commit até o build terminar (máx. 10 min). */
	async function acompanharBuild(commit: string) {
		const alvo = document.createElement('span');
		status.append(document.createElement('br'), alvo);
		for (let i = 0; i < 60; i++) {
			try {
				const s = await api<{ estado: string; runs: { nome: string; url: string }[] }>(`/api/status?commit=${commit}`);
				alvo.textContent = `Commit ${commit.slice(0, 7)} · build: ${s.estado}`;
				if (s.estado === 'sucesso' || s.estado === 'falha') return;
			} catch {
				alvo.textContent = `Commit ${commit.slice(0, 7)} · build: sem informação`;
			}
			await new Promise((ok) => setTimeout(ok, 10_000));
		}
	}

	// FR-12: histórico com restauração (abre a versão no editor; publicar gera um novo commit).
	$('ver-historico').addEventListener('click', async () => {
		const caminho = campoCaminho.value.trim();
		const ol = $('historico');
		if (!caminho) { avisar('Abra um artigo para ver o histórico.'); return; }
		ol.innerHTML = '<li>Carregando…</li>';
		try {
			const { versoes } = await api<{ versoes: { sha: string; data: string; autor: string; mensagem: string; url: string }[] }>(`/api/historico?caminho=${encodeURIComponent(caminho)}`);
			ol.innerHTML = '';
			for (const v of versoes) {
				const li = document.createElement('li');
				li.append(`${new Date(v.data).toLocaleString('pt-BR')} · ${v.autor} · ${v.mensagem} `);
				const b = document.createElement('button');
				b.type = 'button';
				b.textContent = 'Abrir esta versão';
				b.addEventListener('click', async () => {
					const r = await api<{ conteudo: string }>(`/api/versao?caminho=${encodeURIComponent(caminho)}&sha=${v.sha}`);
					editor.value = r.conteudo;
					void atualizar();
					avisar(`Versão de ${new Date(v.data).toLocaleString('pt-BR')} aberta. Publique para restaurá-la.`);
				});
				li.append(b);
				ol.append(li);
			}
			if (!versoes.length) ol.innerHTML = '<li>Ainda não publicado.</li>';
		} catch (e) {
			ol.innerHTML = `<li>${String(e instanceof Error ? e.message : e).replace(/</g, '&lt;')}</li>`;
		}
	});

	// FR-04: comandos com "/" no início da linha.
	const menu = $<HTMLUListElement>('comandos');
	let opcoes = COMANDOS;
	let ativo = 0;
	const fecharMenu = () => { menu.hidden = true; editor.removeAttribute('aria-activedescendant'); };
	const consulta = () => {
		const antes = editor.value.slice(0, editor.selectionStart);
		return /(?:^|\n)\/([\p{L}\d-]*)$/u.exec(antes)?.[1] ?? null;
	};
	function desenharMenu() {
		menu.innerHTML = '';
		opcoes.forEach((c, i) => {
			const li = document.createElement('li');
			li.id = `cmd-${i}`;
			li.setAttribute('role', 'option');
			li.setAttribute('aria-selected', String(i === ativo));
			li.textContent = c.rotulo;
			li.addEventListener('mousedown', (e) => { e.preventDefault(); inserirComando(i); });
			menu.append(li);
		});
		editor.setAttribute('aria-activedescendant', `cmd-${ativo}`);
	}
	function inserirComando(i: number) {
		const q = consulta();
		if (q === null) return fecharMenu();
		const fim = editor.selectionStart;
		editor.setRangeText(opcoes[i].texto, fim - q.length - 1, fim, 'end');
		fecharMenu();
		agendar();
	}
	editor.addEventListener('input', () => {
		const q = consulta();
		opcoes = q === null ? [] : filtrarComandos(q);
		if (!opcoes.length) return fecharMenu();
		ativo = 0;
		menu.hidden = false;
		desenharMenu();
	});
	editor.addEventListener('keydown', (e) => {
		if (menu.hidden) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			ativo = (ativo + (e.key === 'ArrowDown' ? 1 : opcoes.length - 1)) % opcoes.length;
			desenharMenu();
		} else if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault();
			inserirComando(ativo);
		} else if (e.key === 'Escape') fecharMenu();
	});
	editor.addEventListener('blur', fecharMenu);

	// FR-13/14/15: eBook com artigos escolhidos, capítulos ordenados, EPUB, Web Book e PDF.
	function desenharLivro() {
		const ol = $('livro');
		ol.innerHTML = '';
		livro.forEach((caminho, i) => {
			const li = document.createElement('li');
			const nome = document.createElement('span');
			nome.textContent = caminho.split('/').pop()!.replace(/\.md$/, '');
			const mover = (d: number, rotulo: string, simbolo: string) => {
				const b = document.createElement('button');
				b.type = 'button';
				b.textContent = simbolo;
				b.setAttribute('aria-label', `${rotulo}: ${nome.textContent}`);
				b.disabled = i + d < 0 || i + d >= livro.length;
				b.addEventListener('click', () => { [livro[i], livro[i + d]] = [livro[i + d], livro[i]]; desenharLivro(); });
				return b;
			};
			li.append(nome, mover(-1, 'Subir', '↑'), mover(1, 'Descer', '↓'));
			ol.append(li);
		});
	}
	async function capitulos() {
		if (!livro.length) throw new Error('Marque ao menos um artigo na lista para montar o eBook.');
		return Promise.all(livro.map(async (caminho) => {
			const { conteudo } = await api<{ conteudo: string }>(`/api/artigo?caminho=${encodeURIComponent(caminho)}`);
			const r = await renderMarkdown(conteudo, { indice, urlAsset });
			return { titulo: String(r.dados.title ?? caminho), html: r.html };
		}));
	}
	const cssDaPagina = () => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n');
	const baixar = (dados: BlobPart, tipo: string, nome: string) => {
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([dados], { type: tipo }));
		a.download = nome;
		a.click();
	};
	const tituloLivro = () => $<HTMLInputElement>('livro-titulo').value.trim() || 'EXECUTAR';
	const comLivro = (fn: () => Promise<void>) => async () => { try { avisar('Montando o eBook…'); await fn(); avisar('eBook pronto.'); } catch (e) { avisar(e instanceof Error ? e.message : String(e)); } };
	$('livro-epub').addEventListener('click', comLivro(async () => {
		baixar(gerarEpub({ titulo: tituloLivro(), capitulos: await capitulos(), css: cssDaPagina() }) as Uint8Array<ArrayBuffer>, 'application/epub+zip', `${tituloLivro()}.epub`);
	}));
	$('livro-web').addEventListener('click', comLivro(async () => {
		baixar(gerarLivroWeb({ titulo: tituloLivro(), capitulos: await capitulos(), css: cssDaPagina() }), 'text/html', `${tituloLivro()}.html`);
	}));
	$('livro-pdf').addEventListener('click', comLivro(async () => {
		const janela = window.open('', '_blank');
		if (!janela) throw new Error('Permita pop-ups para gerar o PDF.');
		janela.document.write(gerarLivroWeb({ titulo: tituloLivro(), capitulos: await capitulos(), css: cssDaPagina() }));
		janela.document.close();
		janela.addEventListener('load', () => janela.print());
		setTimeout(() => janela.print(), 800);
	}));

	void (async () => {
		abrir('', recuperar(chave('novo')) ?? MODELO);
		try {
			const eu = await api<{ email: string; papel: string; blog: string }>('/api/eu');
			$('eu').textContent = `${eu.email} · ${eu.papel}`;
			blog = eu.blog.replace(/\/$/, '');
			for (const b of document.querySelectorAll<HTMLButtonElement>('[data-modo]')) {
				if (eu.papel === 'leitor' || (eu.papel === 'autor' && b.dataset.modo === 'publish')) b.hidden = true;
			}
			const [lista, idx] = await Promise.all([api<{ artigos: string[] }>('/api/artigos'), api<{ arquivos: Arquivo[] }>('/api/indice')]);
			indice = criarIndice(idx.arquivos);
			const ul = $('artigos');
			ul.innerHTML = '';
			artigos = lista.artigos;
			for (const caminho of artigos) {
				const li = document.createElement('li');
				const b = document.createElement('button');
				b.type = 'button';
				b.textContent = caminho;
				b.addEventListener('click', async () => {
					const r = await api<{ conteudo: string; sha: string }>(`/api/artigo?caminho=${encodeURIComponent(caminho)}`);
					abrir(caminho, r.conteudo, r.sha);
				});
				const marca = document.createElement('input');
				marca.type = 'checkbox';
				marca.setAttribute('aria-label', `Incluir “${caminho}” no eBook`);
				marca.addEventListener('change', () => {
					const i = livro.indexOf(caminho);
					if (marca.checked && i < 0) livro.push(caminho);
					if (!marca.checked && i >= 0) livro.splice(i, 1);
					desenharLivro();
				});
				li.style.display = 'flex';
				li.append(marca, b);
				ul.append(li);
			}
			void atualizar();
		} catch (e) {
			$('artigos').innerHTML = `<li>${String(e instanceof Error ? e.message : e).replace(/</g, '&lt;')}</li>`;
		}
	})();
}
