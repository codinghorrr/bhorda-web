import { randomId } from './crypto';
import { sha256Hex } from './crypto';
import { getSiteSetting } from './submissions';

export type AnalyticsSettings = {
	ga4Enabled: boolean;
	ga4Snippet: string;
	headScripts: string;
	cfWebAnalyticsEnabled: boolean;
	cfWebAnalyticsToken: string;
};

export async function loadAnalyticsSettings(db: D1Database): Promise<AnalyticsSettings> {
	const [ga4Enabled, ga4Snippet, headScripts, cfEnabled, cfToken] = await Promise.all([
		getSiteSetting(db, 'ga4_enabled'),
		getSiteSetting(db, 'ga4_snippet'),
		getSiteSetting(db, 'head_scripts'),
		getSiteSetting(db, 'cf_web_analytics_enabled'),
		getSiteSetting(db, 'cf_web_analytics_token'),
	]);

	return {
		ga4Enabled: ga4Enabled === '1',
		ga4Snippet: ga4Snippet ?? '',
		headScripts: headScripts ?? '',
		cfWebAnalyticsEnabled: cfEnabled === '1',
		cfWebAnalyticsToken: cfToken ?? '',
	};
}

export async function saveSiteSetting(db: D1Database, key: string, value: string): Promise<void> {
	await db
		.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
		.bind(key, value)
		.run();
}

/** Renders trusted analytics snippets configured by superadmin (PRD §11). */
export function renderAnalyticsHead(settings: AnalyticsSettings): string {
	const parts: string[] = [];

	if (settings.ga4Enabled && settings.ga4Snippet.trim()) {
		parts.push(settings.ga4Snippet.trim());
	}

	if (settings.cfWebAnalyticsEnabled && settings.cfWebAnalyticsToken.trim()) {
		const token = settings.cfWebAnalyticsToken.trim().replace(/"/g, '\\"');
		parts.push(
			`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>`,
		);
	}

	if (settings.headScripts.trim()) {
		parts.push(settings.headScripts.trim());
	}

	return parts.join('\n');
}

export async function buildAnalyticsHead(env: Env): Promise<string> {
	const settings = await loadAnalyticsSettings(env.DB);
	return renderAnalyticsHead(settings);
}

export async function visitorHash(request: Request): Promise<string> {
	const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'anon';
	const ua = request.headers.get('User-Agent') ?? '';
	return sha256Hex(`${ip}|${ua}`);
}

export async function recordPageView(
	db: D1Database,
	pathname: string,
	locale: string,
	request: Request,
): Promise<void> {
	try {
		const hash = await visitorHash(request);
		const id = randomId('apv');
		await db
			.prepare('INSERT INTO analytics_page_views (id, path, locale, visitor_hash) VALUES (?, ?, ?, ?)')
			.bind(id, pathname, locale, hash)
			.run();
	} catch {
		/* analytics table may be unavailable in unmigrated environments */
	}
}

export type AnalyticsSummary = {
	visitors7d: number;
	pageViews7d: number;
	topPages: { path: string; views: number }[];
	topEvents: { path: string; views: number }[];
	topGallery: { path: string; views: number }[];
	submissionsByDay: { day: string; count: number }[];
	enabledSources: string[];
};

export async function loadAnalyticsSummary(db: D1Database): Promise<AnalyticsSummary> {
	const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

	const visitors = await db
		.prepare(
			`SELECT COUNT(DISTINCT visitor_hash) AS count FROM analytics_page_views WHERE viewed_at >= ?`,
		)
		.bind(since)
		.first<{ count: number }>();

	const pageViews = await db
		.prepare(`SELECT COUNT(*) AS count FROM analytics_page_views WHERE viewed_at >= ?`)
		.bind(since)
		.first<{ count: number }>();

	const topPages = await db
		.prepare(
			`SELECT path, COUNT(*) AS views FROM analytics_page_views WHERE viewed_at >= ? GROUP BY path ORDER BY views DESC LIMIT 10`,
		)
		.bind(since)
		.all<{ path: string; views: number }>();

	const topEvents = await db
		.prepare(
			`SELECT path, COUNT(*) AS views FROM analytics_page_views WHERE viewed_at >= ? AND path LIKE '/events/%' GROUP BY path ORDER BY views DESC LIMIT 5`,
		)
		.bind(since)
		.all<{ path: string; views: number }>();

	const topGallery = await db
		.prepare(
			`SELECT path, COUNT(*) AS views FROM analytics_page_views WHERE viewed_at >= ? AND path LIKE '/gallery%' GROUP BY path ORDER BY views DESC LIMIT 5`,
		)
		.bind(since)
		.all<{ path: string; views: number }>();

	const submissions = await db
		.prepare(
			`SELECT substr(submitted_at, 1, 10) AS day, COUNT(*) AS count FROM submissions WHERE submitted_at >= ? GROUP BY day ORDER BY day`,
		)
		.bind(since.slice(0, 10))
		.all<{ day: string; count: number }>();

	const settings = await loadAnalyticsSettings(db);
	const enabledSources: string[] = ['On-site page views (D1)'];
	if (settings.ga4Enabled) enabledSources.push('Google Analytics 4');
	if (settings.cfWebAnalyticsEnabled) enabledSources.push('Cloudflare Web Analytics');

	return {
		visitors7d: visitors?.count ?? 0,
		pageViews7d: pageViews?.count ?? 0,
		topPages: topPages.results ?? [],
		topEvents: topEvents.results ?? [],
		topGallery: topGallery.results ?? [],
		submissionsByDay: submissions.results ?? [],
		enabledSources,
	};
}
