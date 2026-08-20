import { LOCALES, localizedPath, type Locale } from '../lib/i18n';
import { SITE_ORIGIN } from '../lib/site';
import { collectSiteUrls, localizedUrls, type SiteUrlEntry } from '../lib/site-urls';

function xmlEscape(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function renderUrlBlock(origin: string, entry: SiteUrlEntry, locale: Locale): string {
	const loc = `${origin}${localizedPath(locale, entry.pathname)}`;
	const alternates = LOCALES.map((alt) => {
		const href = localizedUrls(origin, entry.pathname)[alt];
		return `    <xhtml:link rel="alternate" hreflang="${alt}" href="${xmlEscape(href)}" />`;
	}).join('\n');
	const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localizedUrls(origin, entry.pathname).en)}" />`;
	const lastmod = entry.lastmod ? `    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>\n` : '';
	const changefreq = entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>\n` : '';
	const priority = entry.priority != null ? `    <priority>${entry.priority.toFixed(1)}</priority>\n` : '';

	return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${alternates}
${xDefault}
${lastmod}${changefreq}${priority}  </url>`;
}

export async function buildSitemapXml(env: Env, origin: string): Promise<string> {
	const entries = await collectSiteUrls(env.DB);
	const urlBlocks = entries.flatMap((entry) => LOCALES.map((locale) => renderUrlBlock(origin, entry, locale)));

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlBlocks.join('\n')}
</urlset>
`;
}

export function handleSitemap(request: Request, env: Env): Promise<Response> {
	const origin = new URL(request.url).origin || SITE_ORIGIN;
	return buildSitemapXml(env, origin).then((body) =>
		new Response(body, {
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=3600',
			},
		}),
	);
}
