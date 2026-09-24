// Middleware de rota do Starlight (API oficial): o blog segue o shell do EXECUTAR Showroom
// (ADR-012) — sem barra lateral de documentação e sem sumário lateral em nenhuma página.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	route.hasSidebar = false;
	route.toc = undefined;
});
