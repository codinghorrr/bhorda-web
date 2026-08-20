import type { Locale } from '../lib/i18n';
import { htmlLang, localizedPath } from '../lib/i18n';
import { isNewsletterConfigured, newsletterNoticeFromSearchParams } from '../lib/newsletter';
import { absoluteLocalizedUrl, siteCopy } from '../lib/site';
import { escapeHtml } from '../lib/html';
import { renderFooter } from './footer';
import { renderHeader } from './header';

export type PageShellOptions = {
	locale: Locale;
	pathname: string;
	title: string;
	description?: string;
	origin: string;
	main: string;
	translationPending?: boolean;
	headExtras?: string;
	env?: Env;
	newsletterAvailable?: boolean;
	newsletterNotice?: string | null;
	url?: URL;
};

export function renderPageShell(options: PageShellOptions): string {
	const {
		locale,
		pathname,
		title,
		description,
		origin,
		main,
		translationPending = false,
		headExtras = '',
		env,
		newsletterAvailable = env ? isNewsletterConfigured(env) : (options.newsletterAvailable ?? false),
		newsletterNotice = options.newsletterNotice ?? (options.url ? newsletterNoticeFromSearchParams(locale, options.url) : null),
		url: _url,
	} = options;
	const copy = siteCopy(locale);
	const lang = htmlLang(locale);
	const canonical = absoluteLocalizedUrl(origin, locale, pathname);
	const enUrl = absoluteLocalizedUrl(origin, 'en', pathname);
	const guUrl = absoluteLocalizedUrl(origin, 'gu', pathname);
	const metaDescription = description ?? copy.tagline;
	const homeHref = localizedPath(locale, '/');

	const pendingBanner = translationPending
		? `<div class="translation-banner" role="status">${escapeHtml(copy.translationPending)}</div>`
		: '';

	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${escapeHtml(title)}</title>
	<meta name="description" content="${escapeHtml(metaDescription)}" />
	<link rel="canonical" href="${escapeHtml(canonical)}" />
	<link rel="alternate" hreflang="en" href="${escapeHtml(enUrl)}" />
	<link rel="alternate" hreflang="gu" href="${escapeHtml(guUrl)}" />
	<link rel="alternate" hreflang="x-default" href="${escapeHtml(enUrl)}" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Gujarati:wght@400;600;700&display=swap" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Gujarati:wght@400;600;700&display=swap" media="print" onload="this.media='all'" />
	<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Gujarati:wght@400;600;700&display=swap" /></noscript>
	<link rel="stylesheet" href="/styles/site.css" />
	${headExtras}
</head>
<body>
	<a class="skip-link" href="#main-content">${locale === 'gu' ? 'મુખ્ય સામગ્રી પર જાઓ' : 'Skip to main content'}</a>
	${renderHeader({ locale, pathname, newsletterAvailable, newsletterNotice })}
	${pendingBanner}
	<main id="main-content" class="site-main">
		${main}
	</main>
	${renderFooter({ locale, pathname, newsletterAvailable, newsletterNotice })}
	<a class="visually-hidden" href="${escapeHtml(homeHref)}">${escapeHtml(copy.siteName)}</a>
</body>
</html>`;
}

export function renderSimplePage(
	locale: Locale,
	pathname: string,
	origin: string,
	heading: string,
	body: string,
	env?: Env,
	url?: URL,
): string {
	const main = `<div class="container page-simple">
		<h1 class="page-title">${escapeHtml(heading)}</h1>
		<p class="lead">${escapeHtml(body)}</p>
	</div>`;

	return renderPageShell({
		locale,
		pathname,
		title: heading,
		origin,
		main,
		env,
		url,
	});
}
