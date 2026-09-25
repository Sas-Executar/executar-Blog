// @ts-check
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// EXECUTAR Studio (ADR-014): interface estática; o preview roda o MESMO parser do blog no navegador
// (Sätteri em WebAssembly, que precisa de isolamento de origem — ver public/_headers).
const ISOLAMENTO = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' };

export default defineConfig({
	vite: {
		// Design system (ADR-017): Tailwind v4 com os mesmos tokens do blog.
		plugins: [tailwindcss()],
		optimizeDeps: { exclude: ['satteri', '@bruits/satteri-wasm32-wasi'] },
		worker: { format: 'es' },
		build: { target: 'esnext' },
		server: { headers: ISOLAMENTO },
		preview: { headers: ISOLAMENTO },
	},
});
