import { buildAnalyticsHead, recordPageView } from '../lib/analytics';
import { handleAdmin } from '../admin';
import { renderSimplePage } from '../components/layout';
import { htmlResponse } from '../lib/html';
import { resolveI18n } from '../lib/i18n';
import { siteCopy } from '../lib/site';
import { applySecurityHeaders } from '../lib/security';
import { tryServeStaticAsset } from './assets';
import { handleFormSubmit } from './forms';
import { handleHealth } from './health';
import { handleLlms } from './llms';
import { handleMedia } from './media';
import { handleNewsletterSubscribe } from './newsletter';
import { renderHomePage } from './pages/home';
import { renderPublicPage } from './public-pages';
import { handleSitemap } from './sitemap';
import { redirectWwwToApex } from './www';

function requestOrigin(request: Request): string {
	const url = new URL(request.url);
	return url.origin;
}

async function injectAnalyticsHead(env: Env, html: string): Promise<string> {
	const head = await buildAnalyticsHead(env);
	if (!head.trim()) {
		return html;
	}
	return html.replace('</head>', `${head}\n</head>`);
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

	if (request.method === 'GET' && url.pathname === '/sitemap.xml') {
		return applySecurityHeaders(await handleSitemap(request, env));
	}

	if (request.method === 'GET' && url.pathname === '/llms.txt') {
		return applySecurityHeaders(await handleLlms(request, env, false));
	}

	if (request.method === 'GET' && url.pathname === '/llms-full.txt') {
		return applySecurityHeaders(await handleLlms(request, env, true));
	}

	if (url.pathname === '/vedmata' || url.pathname.startsWith('/vedmata/')) {
		return await handleAdmin(request, env, ctx);
	}

	if (url.pathname === '/api/newsletter/subscribe') {
		return applySecurityHeaders(await handleNewsletterSubscribe(request, env));
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

	let html: string | null = null;

	if (pathname === '/') {
		html = await renderHomePage(env, locale, origin, url);
	} else {
		html = await renderPublicPage(env, locale, pathname, origin, url);
	}

	if (html) {
		ctx.waitUntil(recordPageView(env.DB, pathname, locale, request));
		html = await injectAnalyticsHead(env, html);
		return applySecurityHeaders(htmlResponse(html, { locale }));
	}

	const copy = siteCopy(locale);
	const notFound = renderSimplePage(locale, pathname, origin, copy.notFoundTitle, copy.notFoundBody, env, url);
	const notFoundHtml = await injectAnalyticsHead(env, notFound);
	return applySecurityHeaders(htmlResponse(notFoundHtml, { status: 404, locale }));
}
