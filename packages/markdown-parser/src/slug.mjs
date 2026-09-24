// Slugs compartilhados (ADR-013): URL do artigo a partir do caminho no vault e id de título.
import GithubSlugger from 'github-slugger';

/** "Pessoa e cognição/Competição pela atenção.md" → "blog/pessoa-e-cognição/competição-pela-atenção". */
export function idDoCaminho(caminho) {
	return (
		'blog/' +
		caminho
			.replace(/\.md$/i, '')
			.split('/')
			.map((parte) => parte.toLowerCase().trim().replace(/\s+/g, '-'))
			.join('/')
	);
}

/** Id de título igual ao do Starlight/Astro (github-slugger). */
export function slugTitulo(texto) {
	return new GithubSlugger().slug(texto);
}

/** Âncora de bloco do Obsidian (^id) → id HTML válido e estável. */
export function idBloco(id) {
	return `bloco-${id}`;
}
