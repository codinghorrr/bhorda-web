import type { Locale } from './i18n';
import { localizedPath } from './i18n';
import { ABOUT_PAGES, ACTIVITY_PAGES, SANSKAR_PAGES } from './site-structure';

export type SiteUrlEntry = {
	pathname: string;
	lastmod?: string;
	changefreq?: 'weekly' | 'monthly' | 'daily';
	priority?: number;
};

const STATIC_PATHS: readonly string[] = [
	'/',
	'/about',
	...ABOUT_PAGES.map((p) => `/about/${p.slug}`),
	'/events',
	'/gallery',
	'/gallery/photos',
	'/gallery/audio',
	'/gallery/videos',
	'/activities',
	'/activities/sanskaras',
	...ACTIVITY_PAGES.map((p) => `/activities/${p.slug}`),
	...SANSKAR_PAGES.map((s) => `/activities/sanskaras/${s.slug}`),
	'/learn',
	'/learn/downloads',
	'/learn/reading',
	'/learn/links',
	'/contact',
	'/gaushala',
	'/gurukul',
];

function todayIso(): string {
	return new Date().toISOString().slice(0, 10);
}

export async function collectSiteUrls(db: D1Database): Promise<SiteUrlEntry[]> {
	const urls: SiteUrlEntry[] = STATIC_PATHS.map((pathname) => ({
		pathname,
		changefreq: pathname === '/' ? 'weekly' : 'monthly',
		priority: pathname === '/' ? 1 : 0.7,
		lastmod: todayIso(),
	}));

	const events = await db
		.prepare(
			`SELECT id, date_start FROM spotlight_events WHERE status != 'draft' ORDER BY date_start DESC`,
		)
		.all<{ id: string; date_start: string }>();
	for (const row of events.results ?? []) {
		urls.push({
			pathname: `/events/${row.id}`,
			lastmod: row.date_start,
			changefreq: 'weekly',
			priority: 0.8,
		});
	}

	const audio = await db.prepare('SELECT id FROM gallery_audio ORDER BY title_en').all<{ id: string }>();
	for (const row of audio.results ?? []) {
		urls.push({
			pathname: `/gallery/audio/${row.id}`,
			changefreq: 'monthly',
			priority: 0.6,
		});
	}

	return urls;
}

export function localizedUrls(origin: string, pathname: string): Record<Locale, string> {
	return {
		en: `${origin}${localizedPath('en', pathname)}`,
		gu: `${origin}${localizedPath('gu', pathname)}`,
	};
}

export type LlmsContentItem = {
	pathname: string;
	title: string;
	summary: string;
};

export async function collectLlmsContent(db: D1Database): Promise<LlmsContentItem[]> {
	const items: LlmsContentItem[] = [
		{ pathname: '/', title: 'Home', summary: 'Gayatri Kamdhenu Sevatirth, Bhorda — seva, sadhana, and community.' },
		{ pathname: '/about', title: 'About', summary: 'AWGP affiliation, mission, and organization background.' },
		{ pathname: '/events', title: 'Events', summary: 'Spotlight events and regular weekly schedule.' },
		{ pathname: '/gallery', title: 'Gallery', summary: 'Photos, audio (with lyrics), and YouTube video links.' },
		{ pathname: '/activities', title: 'Activities', summary: 'Yagya, sanskaras, sadhana, and community programmes.' },
		{ pathname: '/learn', title: 'Learn & Resources', summary: 'Downloads, reading materials, and useful links.' },
		{ pathname: '/contact', title: 'Contact / Donation', summary: 'Contact details and donation interest forms (no online payment).' },
		{ pathname: '/gaushala', title: 'Gaushala', summary: 'Cow seva and Gau Seva donation interest.' },
		{ pathname: '/gurukul', title: 'Gurukul', summary: 'Values-based education for children and youth.' },
	];

	for (const page of ABOUT_PAGES) {
		items.push({ pathname: `/about/${page.slug}`, title: page.labels.en, summary: page.labels.en });
	}
	for (const page of ACTIVITY_PAGES) {
		items.push({ pathname: `/activities/${page.slug}`, title: page.labels.en, summary: page.labels.en });
	}
	for (const page of SANSKAR_PAGES) {
		items.push({
			pathname: `/activities/sanskaras/${page.slug}`,
			title: page.labels.en,
			summary: `Sanskar: ${page.labels.en}`,
		});
	}

	const events = await db
		.prepare(`SELECT id, title_en, desc_en, date_start FROM spotlight_events WHERE status != 'draft'`)
		.all<{ id: string; title_en: string; desc_en: string | null; date_start: string }>();
	for (const row of events.results ?? []) {
		items.push({
			pathname: `/events/${row.id}`,
			title: row.title_en,
			summary: row.desc_en?.trim() || `Event on ${row.date_start}`,
		});
	}

	const photos = await db
		.prepare('SELECT COUNT(*) AS count FROM gallery_photo')
		.first<{ count: number }>();
	if ((photos?.count ?? 0) > 0) {
		items.push({
			pathname: '/gallery/photos',
			title: 'Photo gallery',
			summary: `${photos?.count ?? 0} photos tagged by activity.`,
		});
	}

	const audio = await db
		.prepare('SELECT id, title_en, composer FROM gallery_audio')
		.all<{ id: string; title_en: string; composer: string | null }>();
	for (const row of audio.results ?? []) {
		items.push({
			pathname: `/gallery/audio/${row.id}`,
			title: row.title_en,
			summary: row.composer ? `Audio by ${row.composer}` : 'Audio track with lyrics',
		});
	}

	const videos = await db
		.prepare('SELECT id, title_en, desc_en FROM gallery_video')
		.all<{ id: string; title_en: string; desc_en: string | null }>();
	for (const row of videos.results ?? []) {
		items.push({
			pathname: '/gallery/videos',
			title: row.title_en,
			summary: row.desc_en?.trim() || 'YouTube video link',
		});
	}

	return items;
}
