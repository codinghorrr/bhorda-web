import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { PRIMARY_NAV } from '../src/lib/nav';
import { ABOUT_PAGES, ACTIVITY_PAGES, SANSKAR_PAGES } from '../src/lib/site-structure';
import { ensureTestMigrations } from './helpers/migrations';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

beforeAll(async () => {
	await ensureTestMigrations(env.DB);
});

const LOCALES = ['en', 'gu'] as const;

function collectPublicPaths(): string[] {
	const paths = new Set<string>(['/']);
	for (const item of PRIMARY_NAV) {
		if (item.path !== '/') paths.add(item.path);
	}
	for (const p of ABOUT_PAGES) paths.add(`/about/${p.slug}`);
	paths.add('/about/our-story');
	for (const p of ACTIVITY_PAGES) paths.add(`/activities/${p.slug}`);
	paths.add('/activities/sanskaras');
	for (const p of SANSKAR_PAGES) paths.add(`/activities/sanskaras/${p.slug}`);
	paths.add('/learn/downloads');
	paths.add('/learn/reading');
	paths.add('/learn/links');
	return [...paths];
}

describe('launch bilingual QA', () => {
	const paths = collectPublicPaths();

	for (const locale of LOCALES) {
		for (const pathname of paths) {
			it(`GET /${locale}${pathname} returns 200 with hreflang`, async () => {
				const request = new IncomingRequest(`http://example.com/${locale}${pathname}`);
				const ctx = createExecutionContext();
				const response = await worker.fetch(request, env, ctx);
				await waitOnExecutionContext(ctx);

				expect(response.status).toBe(200);
				const html = await response.text();
				expect(html).toContain('hreflang="en"');
				expect(html).toContain('hreflang="gu"');
				expect(html).toContain('hreflang="x-default"');
				expect(html).toContain('name="viewport"');
			});
		}
	}

	it('language switch preserves path', async () => {
		const request = new IncomingRequest('http://example.com/en/activities/yagya');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const html = await response.text();
		expect(html).toContain('href="/gu/activities/yagya"');
	});

	it('www redirects to apex', async () => {
		const request = new IncomingRequest('http://www.sevatirthbhorda.org/en');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(301);
		expect(response.headers.get('Location')).toMatch(/^https?:\/\/sevatirthbhorda\.org\//);
	});

	it('launch content: about page has seeded mission text', async () => {
		const request = new IncomingRequest('http://example.com/en/about');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const html = await response.text();
		expect(html).toContain('values-based living');
	});

	it('launch content: events page lists seeded spotlight event', async () => {
		const request = new IncomingRequest('http://example.com/en/events');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const html = await response.text();
		expect(html).toContain('108 Kundi Mahayagya');
	});

	it('launch content: gallery videos page has seeded video', async () => {
		const request = new IncomingRequest('http://example.com/en/gallery/videos');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const html = await response.text();
		expect(html).toContain('Gayatri Pariwar');
	});
});

describe('newsletter configuration helper', () => {
	it('detects placeholder Sendy config as not configured', async () => {
		const { isNewsletterConfigured } = await import('../src/lib/newsletter');
		expect(isNewsletterConfigured(env)).toBe(false);
	});
});
