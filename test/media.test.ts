import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import worker from '../src/index';
import { putObject } from '../src/lib/r2';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('media route', () => {
	it('serves objects from R2 at /media/{key}', async () => {
		const body = new TextEncoder().encode('test-media-body');
		await putObject(env.MEDIA, 'photos/sample.jpg', body.buffer, 'image/jpeg');

		const request = new IncomingRequest('http://example.com/media/photos/sample.jpg');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/jpeg');
		const bytes = new Uint8Array(await response.arrayBuffer());
		expect(bytes).toEqual(new TextEncoder().encode('test-media-body'));
	});

	it('returns 404 for missing media keys', async () => {
		const request = new IncomingRequest('http://example.com/media/missing.jpg');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(404);
	});
});
