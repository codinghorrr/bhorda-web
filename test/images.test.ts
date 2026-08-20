import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { createSession, sessionCookieHeader } from '../src/lib/auth';
import { deriveSessionSigningKey } from '../src/lib/crypto';
import { ensureTestMigrations } from './helpers/migrations';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

/** 2×2 red PNG (minimal valid image for createImageBitmap). */
const TINY_PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVRAI2P8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function base64ToUint8Array(b64: string): Uint8Array {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

beforeAll(async () => {
	await ensureTestMigrations(env.DB);
});

async function managerSessionCookie(): Promise<string> {
	const signingKey = await deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
	const cookieValue = await createSession(env.DB, 'usr_test_manager', signingKey);
	return sessionCookieHeader(cookieValue, false);
}

function extractCsrfToken(setCookie: string | null, html: string): string {
	const match = setCookie?.match(/vedmata_csrf=([^;]+)/);
	if (match) {
		return decodeURIComponent(match[1]!);
	}
	const field = html.match(/name="csrf_token" value="([^"]+)"/);
	if (field) {
		return field[1]!;
	}
	throw new Error('CSRF token not found');
}

describe('gallery photo pipeline (integration)', () => {
	it('resizes, compresses to JPEG, stores only processed bytes in R2', async () => {
		const sessionCookie = await managerSessionCookie();
		const ctx = createExecutionContext();

		const formGet = new IncomingRequest('http://example.com/vedmata/gallery/photos/new', {
			headers: { Cookie: sessionCookie.split(';')[0]! },
		});
		const formPage = await worker.fetch(formGet, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(formPage.status).toBe(200);
		const formHtml = await formPage.text();
		const csrf = extractCsrfToken(formPage.headers.get('Set-Cookie'), formHtml);
		const csrfCookie = `vedmata_csrf=${encodeURIComponent(csrf)}`;

		const pngBytes = base64ToUint8Array(TINY_PNG_BASE64);
		const body = new FormData();
		body.set('csrf_token', csrf);
		body.set('activity_tag', 'general');
		body.set('caption_en', 'Pipeline test');
		body.set('photo', new File([pngBytes], 'original-upload.png', { type: 'image/png' }));

		const upload = new IncomingRequest('http://example.com/vedmata/gallery/photos', {
			method: 'POST',
			headers: { Cookie: `${sessionCookie.split(';')[0]!}; ${csrfCookie}` },
			body,
		});
		const uploadResponse = await worker.fetch(upload, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(uploadResponse.status).toBe(303);
		expect(uploadResponse.headers.get('Location')).toBe('/vedmata/gallery/photos');

		const row = await env.DB.prepare('SELECT url FROM gallery_photo WHERE caption_en = ?')
			.bind('Pipeline test')
			.first<{ url: string }>();
		expect(row?.url).toMatch(/^\/media\/photos\/gph_.+\.jpg$/);

		const mediaKey = row!.url.replace('/media/', '');
		const stored = await env.MEDIA.get(mediaKey);
		expect(stored).not.toBeNull();
		const storedBytes = new Uint8Array(await stored!.arrayBuffer());
		expect(storedBytes[0]).toBe(0xff);
		expect(storedBytes[1]).toBe(0xd8);

		// Original PNG signature must not exist anywhere in R2 for this upload.
		const originalAttempt = await env.MEDIA.get('photos/original-upload.png');
		expect(originalAttempt).toBeNull();

		const list = await env.MEDIA.list({ prefix: 'photos/' });
		for (const object of list.objects) {
			expect(object.key).toMatch(/\.jpg$/);
			const bytes = new Uint8Array(await (await env.MEDIA.get(object.key))!.arrayBuffer());
			expect(bytes[0]).toBe(0xff);
			expect(bytes[1]).toBe(0xd8);
		}
	});
});
