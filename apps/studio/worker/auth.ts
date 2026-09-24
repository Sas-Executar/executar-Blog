/**
 * Autenticação do Studio (ADR-014): Cloudflare Access na frente do Worker e, por defesa em
 * profundidade, o Worker valida o JWT do Access (assinatura RS256, audience, emissor, validade).
 * Sem ACCESS_TEAM/ACCESS_AUD configurados → tudo negado (fail closed). DEV_SEM_ACCESS=1 só no dev.
 */
export interface EnvAuth {
	ACCESS_TEAM?: string; // ex.: "executar" → https://executar.cloudflareaccess.com
	ACCESS_AUD?: string; // Application Audience (AUD) tag da aplicação do Access
	DEV_SEM_ACCESS?: string;
}

export interface Identidade {
	email: string;
}

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const cacheChaves = new Map<string, { chaves: JsonWebKey[]; ate: number }>();

async function chavesDoTime(team: string, buscar: typeof fetch): Promise<JsonWebKey[]> {
	const c = cacheChaves.get(team);
	if (c && c.ate > Date.now()) return c.chaves;
	const res = await buscar(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
	if (!res.ok) throw new Error(`certs do Access: HTTP ${res.status}`);
	const { keys } = (await res.json()) as { keys: JsonWebKey[] };
	cacheChaves.set(team, { chaves: keys, ate: Date.now() + 60 * 60 * 1000 });
	return keys;
}

export async function identificar(request: Request, env: EnvAuth, buscar: typeof fetch = fetch): Promise<Identidade | null> {
	if (env.DEV_SEM_ACCESS === '1') return { email: 'dev@local' };
	if (!env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
	const token = request.headers.get('Cf-Access-Jwt-Assertion') ?? /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(request.headers.get('Cookie') ?? '')?.[1];
	if (!token) return null;
	const partes = token.split('.');
	if (partes.length !== 3) return null;
	try {
		const cab = JSON.parse(new TextDecoder().decode(b64url(partes[0]))) as { kid?: string; alg?: string };
		const corpo = JSON.parse(new TextDecoder().decode(b64url(partes[1]))) as { aud?: string | string[]; exp?: number; nbf?: number; iss?: string; email?: string; common_name?: string };
		if (cab.alg !== 'RS256') return null;
		const chave = (await chavesDoTime(env.ACCESS_TEAM, buscar)).find((k) => (k as { kid?: string }).kid === cab.kid);
		if (!chave) return null;
		const cripto = await crypto.subtle.importKey('jwk', chave, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
		const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cripto, b64url(partes[2]), new TextEncoder().encode(`${partes[0]}.${partes[1]}`));
		if (!ok) return null;
		const agora = Math.floor(Date.now() / 1000);
		const auds = Array.isArray(corpo.aud) ? corpo.aud : [corpo.aud];
		if (!auds.includes(env.ACCESS_AUD)) return null;
		if (!corpo.exp || corpo.exp < agora || (corpo.nbf && corpo.nbf > agora + 60)) return null;
		if (corpo.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) return null;
		// Service token (MCP/automação) não tem e-mail: usa o common_name do token.
		return { email: corpo.email ?? `servico:${corpo.common_name ?? 'desconhecido'}` };
	} catch {
		return null;
	}
}
