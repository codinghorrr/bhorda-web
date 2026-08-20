import { clientIdentifier, checkRateLimit, recordRateLimitAttempt } from '../lib/rate-limit';
import { createSubmission, scheduleOccasionReminder } from '../lib/submissions';
import { applySecurityHeaders } from '../lib/security';

const ALLOWED_FORM_TYPES = new Set([
	'donation_general',
	'donation_gau_seva',
	'donation_devkanya',
	'donation_seva',
	'donation_anniversary',
	'gaushala_donation',
	'gurukul_donation',
	'sanskar_request',
	'activity_connect',
	'stall_pickup',
]);

const DONATION_TYPE_TO_FORM: Record<string, string> = {
	general: 'donation_general',
	gau_seva: 'donation_gau_seva',
	devkanya: 'donation_devkanya',
	seva: 'donation_seva',
	anniversary_birthday_punyatithi: 'donation_anniversary',
};

function clean(value: unknown): string {
	return String(value ?? '').trim();
}

function redirectBack(request: Request, locale: string, submitted = true): Response {
	const referer = request.headers.get('Referer');
	const target = referer ? new URL(referer) : new URL(`/${locale}/contact`, request.url);
	if (submitted) {
		target.searchParams.set('submitted', '1');
	}
	return Response.redirect(target.toString(), 303);
}

export async function handleFormSubmit(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return applySecurityHeaders(new Response('Method Not Allowed', { status: 405 }));
	}

	const ip = clientIdentifier(request);
	const rate = await checkRateLimit(env.DB, 'form_submit', `ip:${ip}`);
	if (!rate.allowed) {
		return applySecurityHeaders(
			new Response('Too many submissions. Please try again later.', {
				status: 429,
				headers: { 'Retry-After': String(rate.retryAfterSeconds) },
			}),
		);
	}

	const form = await request.formData();
	let formType = clean(form.get('form_type'));
	const locale = clean(form.get('locale')) || 'en';

	const donationType = clean(form.get('donation_type'));
	if (donationType && DONATION_TYPE_TO_FORM[donationType]) {
		formType = DONATION_TYPE_TO_FORM[donationType]!;
	}

	if (!ALLOWED_FORM_TYPES.has(formType)) {
		return applySecurityHeaders(new Response('Invalid form type', { status: 400 }));
	}

	const name = clean(form.get('name'));
	const email = clean(form.get('email'));
	const phone = clean(form.get('phone'));
	const message = clean(form.get('message'));

	if (!name || !email) {
		return applySecurityHeaders(new Response('Name and email are required', { status: 400 }));
	}

	const payload: Record<string, string> = { name, email, phone, message, locale };

	for (const [key, value] of form.entries()) {
		if (['form_type', 'locale', 'name', 'email', 'phone', 'message'].includes(key)) {
			continue;
		}
		if (typeof value === 'string') {
			payload[key] = value.trim();
		}
	}

	const submissionId = await createSubmission(env.DB, formType, payload);
	await recordRateLimitAttempt(env.DB, 'form_submit', `ip:${ip}`);

	if (formType === 'donation_anniversary') {
		const occasionDate = clean(form.get('occasion_date'));
		if (occasionDate) {
			await scheduleOccasionReminder(env.DB, submissionId, occasionDate);
		}
	}

	const accept = request.headers.get('Accept') ?? '';
	if (accept.includes('application/json')) {
		return applySecurityHeaders(Response.json({ ok: true, id: submissionId }));
	}

	return applySecurityHeaders(redirectBack(request, locale));
}
