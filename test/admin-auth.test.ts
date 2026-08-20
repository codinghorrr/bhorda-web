import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { createSession, sessionCookieHeader } from '../src/lib/auth';
import { deriveSessionSigningKey } from '../src/lib/crypto';
import { ensureTestMigrations } from './helpers/migrations';
import { ensureTestManagerUser } from './helpers/test-users';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

beforeAll(async () => {
	await ensureTestMigrations(env.DB);
	await ensureTestManagerUser(env.DB);
});

async function managerSessionCookie(): Promise<string> {
	const signingKey = await deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
	const cookieValue = await createSession(env.DB, 'usr_test_manager', signingKey);
	return sessionCookieHeader(cookieValue, false);
}

describe('admin RBAC integration', () => {
	it('redirects unauthenticated users to login', async () => {
		const request = new IncomingRequest('http://example.com/vedmata/events');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('/vedmata/login');
	});

	it('blocks manager from restricted page-text screen', async () => {
		const cookie = await managerSessionCookie();
		const request = new IncomingRequest('http://example.com/vedmata/page-text', {
			headers: { Cookie: cookie.split(';')[0]! },
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(403);
		const html = await response.text();
		expect(html).toContain('Access denied');
	});

	it('allows manager to view submissions inbox shell', async () => {
		const cookie = await managerSessionCookie();
		const request = new IncomingRequest('http://example.com/vedmata/submissions', {
			headers: { Cookie: cookie.split(';')[0]! },
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('Submissions Inbox');
	});
});

describe('superadmin login flow', () => {
	it('shows password step for superadmin email', async () => {
		const loginGet = new IncomingRequest('http://example.com/vedmata/login');
		const ctx = createExecutionContext();
		const loginPage = await worker.fetch(loginGet, env, ctx);
		await waitOnExecutionContext(ctx);
		const setCookie = loginPage.headers.get('Set-Cookie') ?? '';
		const csrfMatch = setCookie.match(/vedmata_csrf=([^;]+)/);
		expect(csrfMatch).toBeTruthy();
		const csrfCookie = `vedmata_csrf=${decodeURIComponent(csrfMatch![1]!)}`;

		const identify = new IncomingRequest('http://example.com/vedmata/login/identify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Cookie: csrfCookie,
			},
			body: `email=hello@axiso.com.au&csrf_token=${encodeURIComponent(decodeURIComponent(csrfMatch![1]!))}`,
		});
		const identifyResponse = await worker.fetch(identify, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(identifyResponse.status).toBe(200);
		const html = await identifyResponse.text();
		expect(html).toContain('Superadmin sign-in');
		expect(html).toContain('type="password"');
	});

	it('logs in superadmin with password secret', async () => {
		const loginGet = new IncomingRequest('http://example.com/vedmata/login');
		const ctx = createExecutionContext();
		const loginPage = await worker.fetch(loginGet, env, ctx);
		await waitOnExecutionContext(ctx);
		const csrfSigned = decodeURIComponent((loginPage.headers.get('Set-Cookie') ?? '').match(/vedmata_csrf=([^;]+)/)?.[1] ?? '');

		const identify = new IncomingRequest('http://example.com/vedmata/login/identify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Cookie: `vedmata_csrf=${encodeURIComponent(csrfSigned)}`,
			},
			body: `email=hello@axiso.com.au&csrf_token=${encodeURIComponent(csrfSigned)}`,
		});
		await worker.fetch(identify, env, ctx);
		await waitOnExecutionContext(ctx);

		const passwordPost = new IncomingRequest('http://example.com/vedmata/auth/superadmin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Cookie: `vedmata_csrf=${encodeURIComponent(csrfSigned)}`,
			},
			body: `email=hello@axiso.com.au&password=${encodeURIComponent(env.SUPERADMIN_PASSWORD)}&csrf_token=${encodeURIComponent(csrfSigned)}`,
		});
		const signIn = await worker.fetch(passwordPost, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(signIn.status).toBe(302);
		expect(signIn.headers.get('Location')).toBe('/vedmata');
		expect(signIn.headers.get('Set-Cookie')).toContain('vedmata_session=');
	});
});
