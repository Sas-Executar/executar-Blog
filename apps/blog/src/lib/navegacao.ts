// Seções principais (handoff de Produto HF01–HF05), usadas no cabeçalho e na barra inferior.
export const SECOES = [
	{ href: '/', rotulo: 'Hoje', icone: 'hoje' },
	{ href: '/explorar/', rotulo: 'Explorar', icone: 'explorar' },
	{ href: '/buscar/', rotulo: 'Buscar', icone: 'buscar' },
	{ href: '/salvos/', rotulo: 'Salvos', icone: 'salvos' },
	{ href: '/preferencias/', rotulo: 'Preferências', icone: 'preferencias' },
] as const;

export function secaoAtual(pathname: string) {
	const p = decodeURI(pathname);
	if (p === '/') return '/';
	if (p.startsWith('/blog/')) return '/explorar/';
	return SECOES.find((s) => s.href !== '/' && p.startsWith(s.href))?.href;
}
