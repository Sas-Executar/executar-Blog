import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Propriedades editoriais dos artigos (ADR-012, handoff de Produto ADR-P04):
// pilar (P1–P3) e nível de consciência (C1–C3) são eixos independentes.
export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				autor: z.string().optional(),
				papel: z.string().optional(),
				pilar: z.enum(['P1', 'P2', 'P3']).optional(),
				consciencia: z.enum(['C1', 'C2', 'C3']).optional(),
				data: z.coerce.date().optional(),
			}),
		}),
	}),
};
