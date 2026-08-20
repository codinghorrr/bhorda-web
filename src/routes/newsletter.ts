import { clientIdentifier, checkRateLimit, recordRateLimitAttempt } from '../lib/rate-limit';
import { isNewsletterConfigured, subscribeViaSendy } from '../lib/newsletter';
import { applySecurityHeaders } from '../lib/security';

function redirectBack(request: Request, outcome: 'success' | 'already' | 'error' | 'unavailable'): Response {
	const referer = request.headers.get('Referer');
	const target = referer ? new URL(referer) : new URL('/', request.url);
	target.searchParams.set('newsletter', outcome);
	return Response.redirect(target.toString(), 303);
}

/**
 * Newsletter subscribe — proxies to Sendy /subscribe when configured (PRD §6.7).
 * Rate-limited like other public forms (PRD §10).
 */
export async function handleNewsletterSubscribe(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return applySecurityHeaders(new Response('Method Not Allowed', { status: 405 }));
	}

	if (!isNewsletterConfigured(env)) {
		return applySecurityHeaders(redirectBack(request, 'unavailable'));
	}

	const ip = clientIdentifier(request);
	const rate = await checkRateLimit(env.DB, 'form_submit', `newsletter:${ip}`);
	if (!rate.allowed) {
		return applySecurityHeaders(
			new Response('Too many requests. Please try again later.', {
				status: 429,
				headers: { 'Retry-After': String(rate.retryAfterSeconds) },
			}),
		);
	}

	const contentType = request.headers.get('Content-Type') ?? '';
	let email = '';

	if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
		const form = await request.formData();
		email = String(form.get('email') ?? '').trim();
	} else {
		return applySecurityHeaders(new Response('Unsupported Media Type', { status: 415 }));
	}

	if (!email || !email.includes('@')) {
		return applySecurityHeaders(redirectBack(request, 'error'));
	}

	await recordRateLimitAttempt(env.DB, 'form_submit', `newsletter:${ip}`);

	const result = await subscribeViaSendy(env, email);
	if (result === 'subscribed') {
		return applySecurityHeaders(redirectBack(request, 'success'));
	}
	if (result === 'already_subscribed') {
		return applySecurityHeaders(redirectBack(request, 'already'));
	}
	return applySecurityHeaders(redirectBack(request, 'error'));
}
