// Salvos (HF04): lista local no navegador, sem conta e sem prazo de expiração.
// Leitura/escrita tolerantes a falha (modo privado, armazenamento bloqueado).
export interface Salvo {
	url: string;
	titulo: string;
	resumo: string;
	categoria: string;
	minutos: number;
}

const CHAVE = 'executar:salvos';

export function lerSalvos(): Salvo[] {
	try {
		const lista = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
		return Array.isArray(lista) ? lista : [];
	} catch {
		return [];
	}
}

export function gravarSalvos(lista: Salvo[]) {
	try {
		localStorage.setItem(CHAVE, JSON.stringify(lista));
		return true;
	} catch {
		return false;
	}
}

export function estaSalvo(url: string) {
	return lerSalvos().some((s) => s.url === url);
}

export function alternarSalvo(item: Salvo) {
	const lista = lerSalvos();
	const existe = lista.some((s) => s.url === item.url);
	const nova = existe ? lista.filter((s) => s.url !== item.url) : [item, ...lista];
	return { salvo: !existe, ok: gravarSalvos(nova) };
}

export function removerSalvo(url: string) {
	return gravarSalvos(lerSalvos().filter((s) => s.url !== url));
}

/** Anuncia uma mensagem para leitores de tela (região aria-live compartilhada). */
export function anunciar(texto: string) {
	const regiao = document.getElementById('anuncio');
	if (!regiao) return;
	regiao.textContent = '';
	requestAnimationFrame(() => (regiao.textContent = texto));
}
