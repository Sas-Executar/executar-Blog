#!/usr/bin/env node
/**
 * Runner do agente "Pergunte aos artigos" (ADR-008). Roda dentro do container do Cloudflare Sandbox.
 * Usa o Claude Agent SDK só com ferramentas de leitura sobre o vault publicado e devolve JSON
 * { resposta, fontes: [{ titulo, url }] } no stdout.
 *
 * Uso: node agente.mjs "<pergunta>"
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';

export const VAULT_DIR = process.env.VAULT_DIR ?? '/vault';
const READ_ONLY_TOOLS = ['Read', 'Grep', 'Glob'];

export const SYSTEM_PROMPT = `Você responde perguntas de leitores do blog EXECUTAR usando apenas os artigos em Markdown do diretório atual.
Pesquise com Grep/Glob, leia os artigos relevantes com Read e responda em português do Brasil, de forma clara e curta.
Se os artigos não cobrirem a pergunta, diga isso. Não invente fontes nem use conhecimento externo.
Em "fontes", liste o caminho relativo de cada artigo usado (por exemplo "Pessoa e cognição/Memória prospectiva.md").`;

const OUTPUT_SCHEMA = {
	type: 'object',
	properties: {
		resposta: { type: 'string' },
		fontes: { type: 'array', items: { type: 'string' } },
	},
	required: ['resposta', 'fontes'],
	additionalProperties: false,
};

export function agentOptions() {
	return {
		cwd: VAULT_DIR,
		tools: READ_ONLY_TOOLS,
		allowedTools: READ_ONLY_TOOLS,
		permissionMode: 'dontAsk',
		settingSources: [],
		maxTurns: 12,
		model: process.env.AGENT_MODEL ?? 'claude-opus-5',
		systemPrompt: SYSTEM_PROMPT,
		outputFormat: { type: 'json_schema', schema: OUTPUT_SCHEMA },
	};
}

/** Caminho do vault → URL publicada pelo starlight-obsidian (output "artigos"). */
export function toArticle(vaultPath) {
	const clean = vaultPath.replace(/^\.?\//, '').replace(/\.md$/, '');
	const titulo = clean.split('/').pop();
	const slug = clean
		.split('/')
		.map((part) => part.toLowerCase().trim().replace(/\s+/g, '-'))
		.join('/');
	return { titulo, url: `/artigos/${slug}/` };
}

export async function perguntar(pergunta, { queryFn = query } = {}) {
	for await (const message of queryFn({ prompt: pergunta, options: agentOptions() })) {
		if (message.type !== 'result') continue;
		if (message.subtype !== 'success' || !message.structured_output) {
			throw new Error(`agente terminou sem resposta (${message.subtype})`);
		}
		const { resposta, fontes } = message.structured_output;
		return { resposta, fontes: [...new Set(fontes)].map(toArticle) };
	}
	throw new Error('agente terminou sem mensagem de resultado');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const pergunta = process.argv[2];
	try {
		if (!pergunta) throw new Error('pergunta vazia');
		process.stdout.write(JSON.stringify(await perguntar(pergunta)));
	} catch (error) {
		process.stdout.write(JSON.stringify({ erro: error instanceof Error ? error.message : String(error) }));
		process.exitCode = 1;
	}
}
