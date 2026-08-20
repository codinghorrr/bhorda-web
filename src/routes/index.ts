import { handleAdmin } from '../admin';
import { renderSimplePage } from '../components/layout';
import { htmlResponse } from '../lib/html';
import { resolveI18n } from '../lib/i18n';
import { siteCopy } from '../lib/site';
import { applySecurityHeaders } from '../lib/security';
import { tryServeStaticAsset } from './assets';
import { handleHealth } from './health';
import { handleNewsletterSubscribe } from './newsletter';
import { renderHomePage } from './pages/home';
import { redirectWwwToApex } from './www';

function requestOrigin(request: Request): string {
	const url = new URL(request.url);
	return url.origin;
}

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const wwwRedirect = redirectWwwToApex(request);
	if (wwwRedirect) {
		return applySecurityHeaders(wwwRedirect);
	}

	const url = new URL(request.url);

	if (request.method === 'GET' && url.pathname === '/health') {
		return applySecurityHeaders(handleHealth());
	}

	if (url.pathname === '/vedmata' || url.pathname.startsWith('/vedmata/')) {
		return applySecurityHeaders(await handleAdmin(request, env, ctx));
	}

	if (url.pathname === '/api/newsletter/subscribe') {
		return applySecurityHeaders(await handleNewsletterSubscribe(request));
	}

	const staticAsset = await tryServeStaticAsset(request, env);
	if (staticAsset) {
		return applySecurityHeaders(staticAsset);
	}

	const i18nResult = resolveI18n(request);
	if (i18nResult instanceof Response) {
		return applySecurityHeaders(i18nResult);
	}

	if (!i18nResult) {
		return applySecurityHeaders(new Response('Not Found', { status: 404 }));
	}

	const { locale, pathname } = i18nResult;
	const origin = requestOrigin(request);

	if (request.method !== 'GET') {
		return applySecurityHeaders(new Response('Method Not Allowed', { status: 405 }));
	}

	if (pathname === '/') {
		const html = await renderHomePage(env, locale, origin);
		return applySecurityHeaders(htmlResponse(html, { locale }));
	}

	const copy = siteCopy(locale);
	const html = renderSimplePage(locale, pathname, origin, copy.notFoundTitle, copy.notFoundBody);
	return applySecurityHeaders(htmlResponse(html, { status: 404, locale }));
}
