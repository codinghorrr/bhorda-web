import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { ensureTestMigrations } from './helpers/migrations';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

beforeAll(async () => {
	await ensureTestMigrations(env.DB);
});

describe('health check', () => {
	it('returns 200 and JSON status (unit style)', async () => {
		const request = new IncomingRequest('http://example.com/health');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.json<{ status: string; service: string }>();
		expect(body.status).toBe('ok');
		expect(body.service).toBe('sevatirth-bhorda');
	});

	it('returns 200 and JSON status (integration style)', async () => {
		const response = await SELF.fetch('https://example.com/health');
		expect(response.status).toBe(200);
		const body = await response.json<{ status: string }>();
		expect(body.status).toBe('ok');
	});
});

describe('www redirect', () => {
	it('301s www to the apex host', async () => {
		const request = new IncomingRequest('https://www.sevatirthbhorda.org/health?x=1');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(301);
		expect(response.headers.get('Location')).toBe('https://sevatirthbhorda.org/health?x=1');
	});
});

describe('i18n routing', () => {
	it('redirects / to /en/ by default', async () => {
		const request = new IncomingRequest('http://example.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('http://example.com/en');
	});

	it('redirects / to /gu/ when Accept-Language prefers Gujarati', async () => {
		const request = new IncomingRequest('http://example.com/', {
			headers: { 'Accept-Language': 'gu,en;q=0.8' },
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('http://example.com/gu');
	});

	it('renders the home page in English', async () => {
		const request = new IncomingRequest('http://example.com/en');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('lang="en"');
		expect(html).toContain('hreflang="en"');
		expect(html).toContain('hreflang="gu"');
		expect(html).toContain('Welcome to Gayatri Kamdhenu Sevatirth');
		expect(html).toContain('href="/gu"');
	});

	it('renders the home page in Gujarati', async () => {
		const request = new IncomingRequest('http://example.com/gu');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('lang="gu"');
		expect(html).toContain('translation-banner');
		expect(html).toContain('Welcome to Gayatri Kamdhenu Sevatirth');
		expect(html).toContain('href="/en"');
	});

	it('language switcher preserves the current page path', async () => {
		const request = new IncomingRequest('http://example.com/en/about');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('href="/gu/about"');
	});
});

describe('newsletter subscribe', () => {
	it('redirects when Sendy is not configured (coming soon)', async () => {
		const request = new IncomingRequest('http://example.com/api/newsletter/subscribe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Referer: 'http://example.com/en',
			},
			body: 'email=test@example.com&locale=en',
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(303);
		const location = response.headers.get('Location') ?? '';
		expect(location).toContain('newsletter=unavailable');
	});

	it('shows coming soon instead of form when Sendy is not configured', async () => {
		const request = new IncomingRequest('http://example.com/en');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		const html = await response.text();
		expect(html).toContain('newsletter-coming-soon');
		expect(html).not.toContain('action="/api/newsletter/subscribe"');
	});
});
