import { renderPageShell } from '../../components/layout';
import { renderSubNav } from '../../components/public-page';
import type { Locale } from '../../lib/i18n';
import { localizedPath } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';
import { getPageText } from '../../lib/content';
import { siteCopy } from '../../lib/site';

type ResourceItem = { title: string; url: string; type?: string };

function parseJsonList(raw: string): ResourceItem[] {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(item): item is ResourceItem =>
				typeof item === 'object' &&
				item !== null &&
				typeof (item as ResourceItem).title === 'string' &&
				typeof (item as ResourceItem).url === 'string',
		);
	} catch {
		return [];
	}
}

const DEFAULT_DOWNLOADS: Record<Locale, ResourceItem[]> = {
	en: [
		{ title: 'Satsankalp', url: '/media/downloads/satsankalp.pdf', type: 'pdf' },
		{ title: 'Daily Aarti & Routine', url: '/media/downloads/daily-aarti.pdf', type: 'pdf' },
	],
	gu: [
		{ title: 'સત્સંકલ્પ', url: '/media/downloads/satsankalp.pdf', type: 'pdf' },
		{ title: 'દૈનિક આરતી અને દિનચર્યા', url: '/media/downloads/daily-aarti.pdf', type: 'pdf' },
	],
};

const DEFAULT_READING_LINKS: Record<Locale, ResourceItem[]> = {
	en: [
		{ title: 'Vicharkranti', url: 'https://www.vicharkranti.com/', type: 'external' },
	],
	gu: [{ title: 'વિચારક્રાંતિ', url: 'https://www.vicharkranti.com/', type: 'external' }],
};

const DEFAULT_EBOOKS: Record<Locale, ResourceItem[]> = {
	en: [],
	gu: [],
};

const DEFAULT_USEFUL_LINKS: Record<Locale, ResourceItem[]> = {
	en: [
		{ title: 'Shantikunj', url: 'https://www.awgp.org/' },
		{ title: 'All World Gayatri Pariwar', url: 'https://www.awgp.org/' },
	],
	gu: [
		{ title: 'શાંતિકુંજ', url: 'https://www.awgp.org/' },
		{ title: 'ઓલ વર્લ્ડ ગાયત્રી પરિવાર', url: 'https://www.awgp.org/' },
	],
};

function learnNav(locale: Locale, pathname: string): string {
	const base = localizedPath(locale, '/learn');
	return renderSubNav(locale, [
		{ href: base, label: locale === 'gu' ? 'શીખો' : 'Overview', active: pathname === '/learn' },
		{ href: `${base}/downloads`, label: locale === 'gu' ? 'ડાઉનલોડ' : 'Downloads', active: pathname === '/learn/downloads' },
		{ href: `${base}/reading`, label: locale === 'gu' ? 'વાંચન' : 'Reading', active: pathname === '/learn/reading' },
		{ href: `${base}/links`, label: locale === 'gu' ? 'ઉપયોગી લિંક્સ' : 'Useful links', active: pathname === '/learn/links' },
	]);
}

async function loadResourceList(
	db: D1Database,
	pageKey: string,
	blockKey: string,
	locale: Locale,
	fallback: ResourceItem[],
): Promise<ResourceItem[]> {
	const block = await getPageText(db, pageKey, blockKey, locale);
	if (block.text) {
		const parsed = parseJsonList(block.text);
		if (parsed.length > 0) return parsed;
	}
	return fallback;
}

function renderResourceList(items: ResourceItem[], locale: Locale): string {
	if (items.length === 0) {
		return `<p class="empty-state">${locale === 'gu' ? 'ટૂંક સમયમાં ઉપલબ્ધ થશે.' : 'Coming soon.'}</p>`;
	}
	return `<ul class="resource-list">${items
		.map((item) => {
			const external = item.type === 'external' || item.url.startsWith('http');
			const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
			const download = item.type === 'pdf' ? ' download' : '';
			return `<li><a href="${escapeHtml(item.url)}"${attrs}${download}>${escapeHtml(item.title)}</a></li>`;
		})
		.join('')}</ul>`;
}

export async function renderLearnHub(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const base = localizedPath(locale, '/learn');
	const main = `<div class="container page-learn">
${learnNav(locale, '/learn')}
<h1 class="page-title">${locale === 'gu' ? 'શીખો અને સંસાધનો' : 'Learn & Resources'}</h1>
<div class="card-grid">
	<a class="card card--link" href="${escapeHtml(`${base}/downloads`)}"><h2 class="card-title">${locale === 'gu' ? 'ડાઉનલોડ' : 'Downloads'}</h2></a>
	<a class="card card--link" href="${escapeHtml(`${base}/reading`)}"><h2 class="card-title">${locale === 'gu' ? 'વાંચન' : 'Reading'}</h2></a>
	<a class="card card--link" href="${escapeHtml(`${base}/links`)}"><h2 class="card-title">${locale === 'gu' ? 'ઉપયોગી લિંક્સ' : 'Useful links'}</h2></a>
</div>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/learn',
		title: `${locale === 'gu' ? 'શીખો' : 'Learn'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderLearnDownloads(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const items = await loadResourceList(env.DB, 'learn', 'downloads', locale, DEFAULT_DOWNLOADS[locale]);

	const main = `<div class="container page-learn">
${learnNav(locale, '/learn/downloads')}
<h1 class="page-title">${locale === 'gu' ? 'ડાઉનલોડ' : 'Downloads'}</h1>
${renderResourceList(items, locale)}
</div>`;

	return renderPageShell({
		locale,
		pathname: '/learn/downloads',
		title: `${locale === 'gu' ? 'ડાઉનલોડ' : 'Downloads'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderLearnReading(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const links = await loadResourceList(env.DB, 'learn', 'reading_links', locale, DEFAULT_READING_LINKS[locale]);
	const ebooks = await loadResourceList(env.DB, 'learn', 'ebooks', locale, DEFAULT_EBOOKS[locale]);

	const ebookSection =
		ebooks.length > 0
			? `<section class="section"><h2 class="section-title">${locale === 'gu' ? 'ઇ-પુસ્તકો' : 'Hosted ebooks'}</h2>${renderResourceList(ebooks, locale)}</section>`
			: '';

	const main = `<div class="container page-learn">
${learnNav(locale, '/learn/reading')}
<h1 class="page-title">${locale === 'gu' ? 'વાંચન' : 'Reading'}</h1>
<section class="section"><h2 class="section-title">${locale === 'gu' ? 'બાહ્ય લિંક્સ' : 'External links'}</h2>${renderResourceList(links, locale)}</section>
${ebookSection}
</div>`;

	return renderPageShell({
		locale,
		pathname: '/learn/reading',
		title: `${locale === 'gu' ? 'વાંચન' : 'Reading'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderLearnLinks(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const items = await loadResourceList(env.DB, 'learn', 'useful_links', locale, DEFAULT_USEFUL_LINKS[locale]);

	const main = `<div class="container page-learn">
${learnNav(locale, '/learn/links')}
<h1 class="page-title">${locale === 'gu' ? 'ઉપયોગી લિંક્સ' : 'Useful links'}</h1>
${renderResourceList(items, locale)}
</div>`;

	return renderPageShell({
		locale,
		pathname: '/learn/links',
		title: `${locale === 'gu' ? 'લિંક્સ' : 'Links'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}
