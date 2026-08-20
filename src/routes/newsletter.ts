import { clientIdentifier, checkRateLimit, recordRateLimitAttempt } from '../lib/rate-limit';

/**
 * Newsletter subscribe — posts to Sendy in Phase 6 (PRD §6.7).
 * Rate-limited like other public forms (PRD §10).
 */
export async function handleNewsletterSubscribe(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
	}

	const ip = clientIdentifier(request);
	const rate = await checkRateLimit(env.DB, 'form_submit', `newsletter:${ip}`);
	if (!rate.allowed) {
		return new Response('Too many requests. Please try again later.', {
			status: 429,
			headers: { 'Retry-After': String(rate.retryAfterSeconds) },
		});
	}

	const contentType = request.headers.get('Content-Type') ?? '';
	let email = '';

	if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
		const form = await request.formData();
		email = String(form.get('email') ?? '').trim();
	} else {
		return new Response('Unsupported Media Type', { status: 415 });
	}

	if (!email || !email.includes('@')) {
		return new Response('Invalid email', { status: 400 });
	}

	await recordRateLimitAttempt(env.DB, 'form_submit', `newsletter:${ip}`);

	return new Response(null, {
		status: 204,
		headers: {
			'X-Newsletter-Stub': 'pending-sendy-integration',
		},
	});
}
