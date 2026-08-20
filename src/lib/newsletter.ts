import type { Locale } from './i18n';
import { siteCopy } from './site';

const PLACEHOLDER_HOSTS = new Set(['example.invalid', 'example.com', 'localhost']);
const PLACEHOLDER_VALUES = ['replace-me', 'replace-me-local-only'];

function isPlaceholder(value: string): boolean {
	const v = value.trim().toLowerCase();
	return !v || PLACEHOLDER_VALUES.some((p) => v.includes(p));
}

/** True when SENDY_URL and SENDY_LIST_ID are set to real (non-placeholder) values. */
export function isNewsletterConfigured(env: Env): boolean {
	const url = env.SENDY_URL?.trim() ?? '';
	const listId = env.SENDY_LIST_ID?.trim() ?? '';
	if (!url || !listId || isPlaceholder(url) || isPlaceholder(listId)) {
		return false;
	}
	try {
		const parsed = new URL(url);
		if (PLACEHOLDER_HOSTS.has(parsed.hostname)) {
			return false;
		}
		return parsed.protocol === 'https:' || parsed.protocol === 'http:';
	} catch {
		return false;
	}
}

/** Sendy subscribe endpoint — `${SENDY_URL}/subscribe` with trailing slash normalized. */
export function sendySubscribeUrl(env: Env): string | null {
	if (!isNewsletterConfigured(env)) {
		return null;
	}
	const base = env.SENDY_URL.trim().replace(/\/+$/, '');
	return `${base}/subscribe`;
}

export type SendySubscribeResult = 'subscribed' | 'already_subscribed' | 'error';

/** POST email to Sendy. Returns outcome for redirect messaging. */
export async function subscribeViaSendy(env: Env, email: string): Promise<SendySubscribeResult> {
	const url = sendySubscribeUrl(env);
	if (!url) {
		return 'error';
	}

	const body = new URLSearchParams({
		email,
		list: env.SENDY_LIST_ID.trim(),
		boolean: 'true',
	});

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	});

	if (!response.ok) {
		return 'error';
	}

	const text = (await response.text()).trim().toLowerCase();
	if (text === 'true' || text.includes('confirmation email')) {
		return 'subscribed';
	}
	if (text.includes('already subscribed')) {
		return 'already_subscribed';
	}
	return 'error';
}

export function newsletterNoticeFromSearchParams(locale: Locale, url: URL): string | null {
	const param = url.searchParams.get('newsletter');
	if (!param) {
		return null;
	}
	const copy = siteCopy(locale);
	switch (param) {
		case 'success':
			return copy.newsletterSuccess;
		case 'already':
			return copy.newsletterAlready;
		case 'error':
			return copy.newsletterError;
		case 'unavailable':
			return copy.newsletterComingSoon;
		default:
			return null;
	}
}
