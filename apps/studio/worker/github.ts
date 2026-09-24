/**
 * Cliente GitHub do Studio (ADR-014). A credencial vive só em secrets do Worker — o navegador
 * nunca a recebe. Preferência: GitHub App (token de instalação de 1h, permissão só neste repo);
 * alternativa: token fine-grained (GITHUB_TOKEN).
 */
export interface EnvGithub {
	GITHUB_REPO: string; // "Sas-Executar/executar-Blog"
	GITHUB_BRANCH?: string; // "main"
	GITHUB_APP_ID?: string;
	GITHUB_APP_PRIVATE_KEY?: string; // PEM (PKCS#1 do GitHub ou PKCS#8)
	GITHUB_INSTALLATION_ID?: string;
	GITHUB_TOKEN?: string;
	GITHUB_API?: string; // só para testes
}

const API = (env: EnvGithub) => env.GITHUB_API ?? 'https://api.github.com';
const b64url = (dados: Uint8Array | string) =>
	btoa(typeof dados === 'string' ? dados : String.fromCharCode(...dados))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

/** PKCS#1 (BEGIN RSA PRIVATE KEY, formato do GitHub) → PKCS#8, que é o que o WebCrypto importa. */
export function pemParaPkcs8(pem: string): Uint8Array {
	const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
	if (!pem.includes('BEGIN RSA PRIVATE KEY')) return der;
	const tam = (n: number) => (n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]);
	const algo = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
	const octet = [0x04, ...tam(der.length), ...der];
	const corpo = [0x02, 0x01, 0x00, ...algo, ...octet];
	return Uint8Array.from([0x30, ...tam(corpo.length), ...corpo]);
}

export async function jwtDoApp(appId: string, pem: string, agora = Math.floor(Date.now() / 1000)): Promise<string> {
	const chave = await crypto.subtle.importKey('pkcs8', pemParaPkcs8(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
	const cab = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const corpo = b64url(JSON.stringify({ iat: agora - 60, exp: agora + 540, iss: appId }));
	const assinatura = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(`${cab}.${corpo}`)));
	return `${cab}.${corpo}.${b64url(assinatura)}`;
}

let tokenCache: { token: string; ate: number } | null = null;

export async function tokenGithub(env: EnvGithub, buscar: typeof fetch = fetch): Promise<string> {
	if (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_INSTALLATION_ID) {
		if (tokenCache && tokenCache.ate > Date.now() + 60_000) return tokenCache.token;
		const jwt = await jwtDoApp(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
		const res = await buscar(`${API(env)}/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`, {
			method: 'POST',
			headers: { authorization: `Bearer ${jwt}`, accept: 'application/vnd.github+json', 'user-agent': 'executar-studio' },
		});
		if (!res.ok) throw new Error(`GitHub App: não foi possível obter o token (HTTP ${res.status})`);
		const { token, expires_at } = (await res.json()) as { token: string; expires_at: string };
		tokenCache = { token, ate: Date.parse(expires_at) };
		return token;
	}
	if (env.GITHUB_TOKEN) return env.GITHUB_TOKEN;
	throw new Error('Credencial do GitHub não configurada (GitHub App ou GITHUB_TOKEN).');
}

export function limparCacheToken() {
	tokenCache = null;
}

export class GitHub {
	private env: EnvGithub;
	private buscar: typeof fetch;
	constructor(env: EnvGithub, buscar: typeof fetch = fetch) {
		this.env = env;
		this.buscar = buscar;
	}

	get ramo() {
		return this.env.GITHUB_BRANCH ?? 'main';
	}

	async api<T = unknown>(caminho: string, init: RequestInit = {}): Promise<T> {
		const token = await tokenGithub(this.env, this.buscar);
		const res = await this.buscar(`${API(this.env)}/repos/${this.env.GITHUB_REPO}${caminho}`, {
			...init,
			headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'executar-studio', 'x-github-api-version': '2022-11-28', ...init.headers },
		});
		if (!res.ok) {
			const texto = await res.text();
			throw new ErroGithub(res.status, `GitHub ${init.method ?? 'GET'} ${caminho}: HTTP ${res.status} ${texto.slice(0, 200)}`);
		}
		return (res.status === 204 ? null : await res.json()) as T;
	}

	/** Todos os arquivos do vault (caminho relativo ao vault + sha do blob). */
	async listarVault(ref = this.ramo) {
		const arvore = await this.api<{ tree: { path: string; type: string; sha: string }[] }>(`/git/trees/${encodeURIComponent(ref)}?recursive=1`);
		return arvore.tree.filter((t) => t.type === 'blob' && t.path.startsWith('vault/')).map((t) => ({ caminho: t.path.slice('vault/'.length), sha: t.sha }));
	}

	async lerArquivo(caminhoVault: string, ref = this.ramo): Promise<{ conteudo: string; sha: string } | null> {
		try {
			const r = await this.api<{ content: string; sha: string }>(`/contents/${encodeURI(`vault/${caminhoVault}`)}?ref=${encodeURIComponent(ref)}`);
			const bytes = Uint8Array.from(atob(r.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
			return { conteudo: new TextDecoder().decode(bytes), sha: r.sha };
		} catch (e) {
			if (e instanceof ErroGithub && e.status === 404) return null;
			throw e;
		}
	}

	async shaDoRamo(ramo: string): Promise<string | null> {
		try {
			const r = await this.api<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(ramo)}`);
			return r.object.sha;
		} catch (e) {
			if (e instanceof ErroGithub && e.status === 404) return null;
			throw e;
		}
	}

	/** Commit atômico (blobs → tree → commit) com vários arquivos sobre um commit base. */
	async commitar(base: string, arquivos: { caminho: string; base64: string }[], mensagem: string, autor: string): Promise<string> {
		const baseCommit = await this.api<{ tree: { sha: string } }>(`/git/commits/${base}`);
		const tree = [];
		for (const a of arquivos) {
			const blob = await this.api<{ sha: string }>('/git/blobs', { method: 'POST', body: JSON.stringify({ content: a.base64, encoding: 'base64' }) });
			tree.push({ path: a.caminho, mode: '100644', type: 'blob', sha: blob.sha });
		}
		const novaTree = await this.api<{ sha: string }>('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }) });
		const commit = await this.api<{ sha: string }>('/git/commits', {
			method: 'POST',
			body: JSON.stringify({ message: `${mensagem}\n\nPublicado pelo EXECUTAR Studio por ${autor}.`, tree: novaTree.sha, parents: [base] }),
		});
		return commit.sha;
	}

	async moverRamo(ramo: string, sha: string, forcar = false) {
		const existe = await this.shaDoRamo(ramo);
		if (existe) await this.api(`/git/refs/heads/${encodeURIComponent(ramo)}`, { method: 'PATCH', body: JSON.stringify({ sha, force: forcar }) });
		else await this.api('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${ramo}`, sha }) });
	}

	async abrirPR(ramo: string, titulo: string, corpo: string): Promise<string> {
		const [dono] = this.env.GITHUB_REPO.split('/');
		const abertos = await this.api<{ html_url: string }[]>(`/pulls?head=${encodeURIComponent(`${dono}:${ramo}`)}&state=open`);
		if (abertos.length) return abertos[0].html_url;
		const pr = await this.api<{ html_url: string }>('/pulls', { method: 'POST', body: JSON.stringify({ title: titulo, head: ramo, base: this.ramo, body: corpo }) });
		return pr.html_url;
	}
}

export class ErroGithub extends Error {
	status: number;
	constructor(status: number, mensagem: string) {
		super(mensagem);
		this.status = status;
	}
}
