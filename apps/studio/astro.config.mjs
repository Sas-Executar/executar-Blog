// @ts-check
import { defineConfig } from 'astro/config';

// EXECUTAR Studio (ADR-014): interface estática; o preview roda o MESMO parser do blog no navegador
// (Sätteri em WebAssembly, que precisa de isolamento de origem — ver public/_headers).
const ISOLAMENTO = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' };

export default defineConfig({
	vite: {
		optimizeDeps: { exclude: ['satteri', '@bruits/satteri-wasm32-wasi'] },
		worker: { format: 'es' },
		build: { target: 'esnext' },
		server: { headers: ISOLAMENTO },
		preview: { headers: ISOLAMENTO },
	},
});
