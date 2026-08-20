import { htmlResponse } from '../lib/html';

/**
 * Newsletter subscribe stub — real Sendy POST wiring lands in Phase 6 (PRD §6.7).
 */
export async function handleNewsletterSubscribe(request: Request): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response('Method Not Allowed', { status: 405 });
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

	// Stub: acknowledge without forwarding to Sendy yet.
	return new Response(null, {
		status: 204,
		headers: {
			'X-Newsletter-Stub': 'pending-sendy-integration',
		},
	});
}
