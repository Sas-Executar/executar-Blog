// Studio (ADR-014): autenticação, JWT do GitHub App, Publish API, MCP e utilitários do editor.
// O GitHub é simulado em memória; nenhuma chamada sai da máquina.
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, verify as verificar } from 'node:crypto';
import { test } from 'node:test';
import { identificar } from '../../apps/studio/worker/auth.ts';
import { GitHub, jwtDoApp, limparCacheToken, pemParaPkcs8 } from '../../apps/studio/worker/github.ts';
import { autorizar, papelDe, ErroPermissao } from '../../apps/studio/worker/papeis.ts';
import { ErroConflito, ErroPedido, caminhoSeguro, shaDoBlob, nomeAssetSeguro, publicar, urlPrevia } from '../../apps/studio/worker/publicar.ts';
import { tratarMcp } from '../../apps/studio/worker/mcp.ts';
import { tratar } from '../../apps/studio/worker/index.ts';
import { contarPalavras, definirPropriedade } from '../../apps/studio/src/scripts/frontmatter.ts';

const b64url = (b) => Buffer.from(b).toString('base64url');
const ARTIGO = '---\ntitle: Teste\ndescription: Um teste.\n---\n\nTexto com [[Outro]].\n';

/** GitHub falso: árvore do vault, refs, blobs/trees/commits e PRs. */
function githubFalso() {
	const estado = { refs: { main: 'c0' }, commits: [], prs: [], arquivos: { 'vault/Lab/Outro.md': '---\ntitle: Outro\n---', 'vault/Lab/Velho.md': ARTIGO } };
	let n = 0;
	const buscar = async (url, init = {}) => {
		const u = new URL(url);
		const rota = u.pathname.replace('/repos/o/r', '');
		const corpo = init.body ? JSON.parse(init.body) : null;
		const r = (dados, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'content-type': 'application/json' } });
		const blob = (c) => createHash('sha1').update(`blob ${Buffer.byteLength(c)}\0`).update(c).digest('hex');
		if (rota.startsWith('/git/trees/') && !init.method) return r({ tree: Object.entries(estado.arquivos).map(([path, c]) => ({ path, type: 'blob', sha: blob(c) })) });
		if (rota === '/commits') return r([{ sha: 'abc1234', html_url: 'https://github.com/o/r/commit/abc1234', commit: { message: 'conteúdo: publica\n\nStudio-Autor: eu@x.com', author: { name: 'bot', date: '2026-09-24T10:00:00Z' } } }]);
		if (/^\/commits\/[^/]+\/check-runs$/.test(rota)) return r({ check_runs: estado.checks ?? [] });
		if (rota.startsWith('/contents/')) {
			const c = estado.arquivos[decodeURI(rota.slice('/contents/'.length))];
			return c ? r({ content: Buffer.from(c).toString('base64'), sha: blob(c) }) : r({}, 404);
		}
		if (rota.startsWith('/git/ref/heads/')) {
			const ramo = decodeURIComponent(rota.slice('/git/ref/heads/'.length));
			return estado.refs[ramo] ? r({ object: { sha: estado.refs[ramo] } }) : r({}, 404);
		}
		if (rota.startsWith('/git/commits/')) return r({ tree: { sha: 't0' } });
		if (rota === '/git/blobs') return r({ sha: `b${++n}` });
		if (rota === '/git/trees') return r({ sha: `t${++n}` });
		if (rota === '/git/commits') { estado.commits.push(corpo); return r({ sha: `c${++n}` }); }
		if (rota === '/git/refs') { estado.refs[corpo.ref.replace('refs/heads/', '')] = corpo.sha; return r({}); }
		if (rota.startsWith('/git/refs/heads/')) { estado.refs[decodeURIComponent(rota.slice('/git/refs/heads/'.length))] = corpo.sha; return r({}); }
		if (rota === '/pulls' && init.method === 'POST') { estado.prs.push(corpo); return r({ html_url: 'https://github.com/o/r/pull/1' }); }
		if (rota === '/pulls') return r([]);
		return r({ erro: rota }, 404);
	};
	return { estado, buscar };
}
const ENV = { GITHUB_REPO: 'o/r', GITHUB_TOKEN: 'tk', GITHUB_API: 'https://gh.test', BLOG_URL: 'https://blog.sas.workers.dev' };

test('Access: sem configuração ou sem token → negado (fail closed)', async () => {
	assert.equal(await identificar(new Request('https://s/'), {}), null);
	assert.equal(await identificar(new Request('https://s/'), { ACCESS_TEAM: 't', ACCESS_AUD: 'a' }), null);
	assert.deepEqual(await identificar(new Request('https://s/'), { DEV_SEM_ACCESS: '1' }), { email: 'dev@local' });
});

test('Access: JWT válido aceito; audience errada, expirado e assinatura trocada recusados', async () => {
	const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
	const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1' };
	const buscar = async () => Response.json({ keys: [jwk] });
	const { sign } = await import('node:crypto');
	const jwt = (corpo) => {
		const dados = `${b64url(JSON.stringify({ alg: 'RS256', kid: 'k1' }))}.${b64url(JSON.stringify(corpo))}`;
		return `${dados}.${b64url(sign('sha256', Buffer.from(dados), privateKey))}`;
	};
	const agora = Math.floor(Date.now() / 1000);
	const env = { ACCESS_TEAM: 'time', ACCESS_AUD: 'aud1' };
	const ok = { aud: ['aud1'], exp: agora + 60, iss: 'https://time.cloudflareaccess.com', email: 'eu@x.com' };
	const req = (t) => new Request('https://s/', { headers: { 'Cf-Access-Jwt-Assertion': t } });
	assert.deepEqual(await identificar(req(jwt(ok)), env, buscar), { email: 'eu@x.com' });
	assert.equal(await identificar(req(jwt({ ...ok, aud: 'outra' })), env, buscar), null);
	assert.equal(await identificar(req(jwt({ ...ok, exp: agora - 10 })), env, buscar), null);
	assert.equal(await identificar(req(jwt({ ...ok, iss: 'https://mal.cloudflareaccess.com' })), env, buscar), null);
	const [c, , a] = jwt(ok).split('.');
	assert.equal(await identificar(req(`${c}.${b64url(JSON.stringify({ ...ok, email: 'intruso@x.com' }))}.${a}`), env, buscar), null);
});

test('GitHub App: chave PKCS#1 do GitHub vira PKCS#8 e o JWT RS256 confere', async () => {
	const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
	const pem = privateKey.export({ format: 'pem', type: 'pkcs1' });
	assert.match(pem, /BEGIN RSA PRIVATE KEY/);
	assert.ok(pemParaPkcs8(pem).length > 1000);
	const jwt = await jwtDoApp('123', pem, 1_000_000);
	const [c, corpo, a] = jwt.split('.');
	assert.deepEqual(JSON.parse(Buffer.from(corpo, 'base64url')), { iat: 999_940, exp: 1_000_540, iss: '123' });
	assert.ok(verificar('sha256', Buffer.from(`${c}.${corpo}`), publicKey, Buffer.from(a, 'base64url')));
});

test('Publish API: caminhos e nomes seguros', () => {
	assert.equal(caminhoSeguro('Lab/Novo.md'), 'Lab/Novo.md');
	assert.equal(caminhoSeguro('/vault/Lab/Novo.md'), 'Lab/Novo.md');
	for (const ruim of ['../x.md', 'Lab/x.txt', 'Lab/../../x.md', '.oculto/x.md', '']) assert.throws(() => caminhoSeguro(ruim), ErroPedido, ruim);
	assert.throws(() => nomeAssetSeguro('x.exe'), ErroPedido);
	assert.equal(urlPrevia('rascunho/lab-novo', 'https://executar-blog.sas.workers.dev'), 'https://rascunho-lab-novo-executar-blog.sas.workers.dev');
});

test('Publish API: draft cria ramo, publish avança a main, pr abre PR, inválido não grava', async () => {
	limparCacheToken();
	const { estado, buscar } = githubFalso();
	const gh = new GitHub(ENV, buscar);
	const draft = await publicar({ modo: 'draft', caminho: 'Lab/Novo.md', markdown: ARTIGO }, gh, ENV, 'eu@x.com');
	assert.equal(draft.ok, true);
	assert.equal(estado.refs['rascunho/lab-novo'], draft.commit);
	assert.equal(estado.refs.main, 'c0');
	const pr = await publicar({ modo: 'pr', caminho: 'Lab/Novo.md', markdown: ARTIGO }, gh, ENV, 'eu@x.com');
	assert.equal(pr.url, 'https://github.com/o/r/pull/1');
	assert.equal(estado.prs[0].base, 'main');
	const pub = await publicar({ modo: 'publish', caminho: 'Lab/Novo.md', markdown: ARTIGO, assets: [{ nome: 'foto.png', base64: 'AAAA' }] }, gh, ENV, 'eu@x.com');
	assert.equal(estado.refs.main, pub.commit);
	assert.equal(pub.url, 'https://blog.sas.workers.dev/blog/lab/novo/');
	assert.match(estado.commits.at(-1).message, /Publicado pelo EXECUTAR Studio por eu@x.com/);
	const antes = estado.commits.length;
	const ruim = await publicar({ modo: 'publish', caminho: 'Lab/Novo.md', markdown: 'sem frontmatter' }, gh, ENV, 'eu@x.com');
	assert.equal(ruim.ok, false);
	assert.equal(estado.commits.length, antes);
	await assert.rejects(publicar({ modo: 'apagar', caminho: 'Lab/Novo.md', markdown: ARTIGO }, gh, ENV, 'eu'), ErroPedido);
});

test('MCP: initialize, tools/list, validar e erro de ferramenta', async () => {
	const { buscar } = githubFalso();
	const gh = new GitHub(ENV, buscar);
	const rpc = async (corpo) => (await tratarMcp(new Request('https://s/mcp', { method: 'POST', body: JSON.stringify(corpo) }), gh, ENV, 'eu')).json();
	const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
	assert.equal(init.result.serverInfo.name, 'executar-studio');
	const { result } = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
	assert.deepEqual(result.tools.map((t) => t.name), ['listar_artigos', 'ler_artigo', 'validar_artigo', 'pre_visualizar', 'publicar', 'historico_artigo', 'status_publicacao']);
	const val = await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'validar_artigo', arguments: { markdown: '---\ntitle: x\n---\n' } } });
	assert.match(val.result.content[0].text, /description/);
	const lido = await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'ler_artigo', arguments: { caminho: 'Lab/Velho.md' } } });
	assert.match(lido.result.content[0].text, /Texto com/);
	const desconhecida = await rpc({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'apagar_tudo', arguments: {} } });
	assert.equal(desconhecida.error.code, -32602);
	const notif = await tratarMcp(new Request('https://s/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }), gh, ENV, 'eu');
	assert.equal(notif.status, 202);
});

test('Worker: sem Access → 403 em /api e /mcp', async () => {
	for (const rota of ['/api/artigos', '/mcp']) assert.equal((await tratar(new Request(`https://s${rota}`), { ...ENV })).status, 403);
});

test('Editor: contagem de palavras e propriedades no frontmatter preservando o resto', () => {
	assert.equal(contarPalavras('---\ntitle: a b c\n---\nUm dois, três.'), 3);
	const md = '---\n# comentário\ntitle: Velho\n---\n\nCorpo';
	const novo = definirPropriedade(md, 'title', 'Novo');
	assert.match(novo, /# comentário\ntitle: Novo\n---\n\nCorpo$/);
	assert.match(definirPropriedade(novo, 'tags', ['a', 'b']), /tags:\n {2}- a\n {2}- b/);
	assert.match(definirPropriedade('Corpo', 'title', 'X'), /^---\ntitle: X\n---\n\nCorpo$/);
});

test('RBAC: sem PAPEIS todos são editores; autor não publica; configuração inválida vira leitor', () => {
	assert.equal(papelDe('a@x.com', {}), 'editor');
	const env = { PAPEIS: JSON.stringify({ 'chefe@x.com': 'admin', '*': 'autor' }) };
	assert.equal(papelDe('Chefe@x.com', env), 'admin');
	assert.equal(papelDe('outro@x.com', env), 'autor');
	assert.equal(papelDe('a@x.com', { PAPEIS: '{quebrado' }), 'leitor');
	assert.throws(() => autorizar('autor', 'publish'), ErroPermissao);
	assert.doesNotThrow(() => autorizar('autor', 'pr'));
	assert.throws(() => autorizar('leitor', 'draft'), ErroPermissao);
});

test('Publish API: idempotente, conflito detectado e papel respeitado', async () => {
	const { estado, buscar } = githubFalso();
	const gh = new GitHub(ENV, buscar);
	assert.equal(await shaDoBlob('abc'), createHash('sha1').update('blob 3\0abc').digest('hex'));
	const igual = await publicar({ modo: 'publish', caminho: 'Lab/Velho.md', markdown: ARTIGO }, gh, ENV, 'eu');
	assert.equal(igual.idempotente, true);
	assert.equal(estado.commits.length, 0);
	await assert.rejects(publicar({ modo: 'publish', caminho: 'Lab/Velho.md', markdown: `${ARTIGO}mais`, shaOriginal: 'deadbeef' }, gh, ENV, 'eu'), ErroConflito);
	const semConflito = await publicar({ modo: 'publish', caminho: 'Lab/Velho.md', markdown: `${ARTIGO}mais`, shaOriginal: await shaDoBlob(ARTIGO) }, gh, ENV, 'eu');
	assert.equal(semConflito.ok, true);
	await assert.rejects(publicar({ modo: 'publish', caminho: 'Lab/N.md', markdown: ARTIGO }, gh, { ...ENV, PAPEIS: '{"*":"autor"}' }, 'eu'), ErroPermissao);
});

test('Histórico e status do build via GitHub', async () => {
	const { estado, buscar } = githubFalso();
	const gh = new GitHub(ENV, buscar);
	const [v] = await gh.historico('Lab/Velho.md');
	assert.deepEqual({ sha: v.sha, autor: v.autor, mensagem: v.mensagem }, { sha: 'abc1234', autor: 'eu@x.com', mensagem: 'conteúdo: publica' });
	assert.equal((await gh.statusDoCommit('abc1234')).estado, 'aguardando');
	estado.checks = [{ name: 'Workers Builds: executar-blog', status: 'in_progress', conclusion: null, details_url: 'u' }];
	assert.equal((await gh.statusDoCommit('abc1234')).estado, 'em andamento');
	estado.checks = [{ name: 'Workers Builds: executar-blog', status: 'completed', conclusion: 'success', details_url: 'u' }];
	assert.equal((await gh.statusDoCommit('abc1234')).estado, 'sucesso');
	estado.checks.push({ name: 'x', status: 'completed', conclusion: 'failure', details_url: 'u' });
	assert.equal((await gh.statusDoCommit('abc1234')).estado, 'falha');
});
