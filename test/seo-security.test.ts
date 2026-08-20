import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { getSecurityHeaderNames } from '../src/lib/security';
import { ensureTestMigrations } from './helpers/migrations';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

beforeAll(async () => {
	await ensureTestMigrations(env.DB);
});

describe('SEO routes', () => {
	it('serves sitemap.xml with hreflang alternates', async () => {
		const request = new IncomingRequest('http://example.com/sitemap.xml');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('xml');
		const body = await response.text();
		expect(body).toContain('<urlset');
		expect(body).toContain('hreflang="en"');
		expect(body).toContain('hreflang="gu"');
		expect(body).toContain('/en/about');
		expect(body).toContain('/gu/about');
	});

	it('serves llms.txt and llms-full.txt', async () => {
		const ctx = createExecutionContext();

		const brief = await worker.fetch(new IncomingRequest('http://example.com/llms.txt'), env, ctx);
		await waitOnExecutionContext(ctx);
		expect(brief.status).toBe(200);
		const briefText = await brief.text();
		expect(briefText).toContain('Gayatri Kamdhenu Sevatirth');
		expect(briefText).toContain('llms-full.txt');

		const full = await worker.fetch(new IncomingRequest('http://example.com/llms-full.txt'), env, ctx);
		await waitOnExecutionContext(ctx);
		expect(full.status).toBe(200);
		const fullText = await full.text();
		expect(fullText).toContain('Gujarati:');
	});
});

describe('security headers', () => {
	it('applies PRD §10 headers on public HTML pages', async () => {
		const request = new IncomingRequest('http://example.com/en');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		for (const name of getSecurityHeaderNames()) {
			expect(response.headers.get(name), `missing ${name}`).toBeTruthy();
		}
		expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
		expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
	});

	it('applies security headers on form and sitemap endpoints', async () => {
		const ctx = createExecutionContext();

		const sitemap = await worker.fetch(new IncomingRequest('http://example.com/sitemap.xml'), env, ctx);
		await waitOnExecutionContext(ctx);
		expect(sitemap.headers.get('X-Content-Type-Options')).toBe('nosniff');

		const form = await worker.fetch(
			new IncomingRequest('http://example.com/api/forms/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
				body: 'form_type=sanskar_request&name=a&email=b@c.com',
			}),
			env,
			ctx,
		);
		await waitOnExecutionContext(ctx);
		expect(form.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});
});

describe('analytics tracking', () => {
	it('records a page view when rendering a public page', async () => {
		const request = new IncomingRequest('http://example.com/en/gallery/photos');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);

		const count = await env.DB.prepare(
			"SELECT COUNT(*) AS count FROM analytics_page_views WHERE path = '/gallery/photos'",
		).first<{ count: number }>();
		expect(count?.count).toBeGreaterThan(0);
	});
});
