import { handleAdmin } from '../admin';
import { renderSimplePage } from '../components/layout';
import { htmlResponse } from '../lib/html';
import { resolveI18n } from '../lib/i18n';
import { siteCopy } from '../lib/site';
import { applySecurityHeaders } from '../lib/security';
import { tryServeStaticAsset } from './assets';
import { handleFormSubmit } from './forms';
import { handleHealth } from './health';
import { handleMedia } from './media';
import { handleNewsletterSubscribe } from './newsletter';
import { renderHomePage } from './pages/home';
import { renderPublicPage } from './public-pages';
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
		return await handleAdmin(request, env, ctx);
	}

	if (url.pathname === '/api/newsletter/subscribe') {
		return applySecurityHeaders(await handleNewsletterSubscribe(request));
	}

	if (url.pathname === '/api/forms/submit') {
		return await handleFormSubmit(request, env);
	}

	const mediaResponse = await handleMedia(request, env);
	if (mediaResponse) {
		return applySecurityHeaders(mediaResponse);
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

	const html = await renderPublicPage(env, locale, pathname, origin, url);
	if (html) {
		return applySecurityHeaders(htmlResponse(html, { locale }));
	}

	const copy = siteCopy(locale);
	const notFound = renderSimplePage(locale, pathname, origin, copy.notFoundTitle, copy.notFoundBody);
	return applySecurityHeaders(htmlResponse(notFound, { status: 404, locale }));
}
