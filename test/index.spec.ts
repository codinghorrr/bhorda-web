import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

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
