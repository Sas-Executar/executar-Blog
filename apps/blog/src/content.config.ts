import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';
import { esquemaEditorial } from '@executar/content-schema';
import { idDoCaminho } from '@executar/markdown-parser';

// Vault como fonte única (ADR-013/ADR-014): o blog lê vault/**/*.md direto — sem cópia convertida.
// Nos testes (E2E_FIXTURES=1) entram também as notas de tests/fixtures/vault.
const bases = ['vault', ...(process.env.E2E_FIXTURES ? ['tests/fixtures/vault'] : [])];

export const collections = {
	docs: defineCollection({
		loader: glob({
			base: '../..',
			pattern: bases.map((b) => `${b}/**/[!_]*.md`),
			generateId: ({ entry }) => idDoCaminho(entry.replace(/^(tests\/fixtures\/)?vault\//, '')),
		}),
		schema: docsSchema({ extend: esquemaEditorial(z) }),
	}),
};
