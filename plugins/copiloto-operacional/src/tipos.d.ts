// A migration do ledger entra no bundle como texto (esbuild loader "text").
declare module '*.sql' {
	const conteudo: string;
	export default conteudo;
}
