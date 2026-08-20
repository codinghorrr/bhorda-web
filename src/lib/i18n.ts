export type Locale = 'en' | 'gu';

export const LOCALES: readonly Locale[] = ['en', 'gu'] as const;
export const DEFAULT_LOCALE: Locale = 'en';
export const LANG_COOKIE = 'lang_pref';

export type I18nContext = {
	locale: Locale;
	/** Path without the locale prefix, always starts with `/`. */
	pathname: string;
};

const LOCALE_PREFIX_RE = /^\/(en|gu)(?=\/|$)/;

/** Paths that bypass locale-prefix routing. */
export function isI18nExemptPath(pathname: string): boolean {
	return (
		pathname === '/health' ||
		pathname === '/sitemap.xml' ||
		pathname === '/llms.txt' ||
		pathname === '/llms-full.txt' ||
		pathname === '/vedmata' ||
		pathname.startsWith('/vedmata/') ||
		pathname.startsWith('/api/')
	);
}

export function isLocale(value: string): value is Locale {
	return value === 'en' || value === 'gu';
}

export function parseLocalePath(pathname: string): { locale: Locale | null; pathname: string } {
	const match = LOCALE_PREFIX_RE.exec(pathname);
	if (!match) {
		return { locale: null, pathname: normalizePathname(pathname) };
	}

	const locale = match[1] as Locale;
	const remainder = pathname.slice(match[0].length) || '/';
	return { locale, pathname: normalizePathname(remainder) };
}

export function normalizePathname(pathname: string): string {
	if (!pathname || pathname === '/') {
		return '/';
	}
	const trimmed = pathname.replace(/\/+$/, '');
	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function localizedPath(locale: Locale, pathname: string): string {
	const normalized = normalizePathname(pathname);
	if (normalized === '/') {
		return `/${locale}`;
	}
	return `/${locale}${normalized}`;
}

export function swapLocalePath(pathname: string, targetLocale: Locale): string {
	const { pathname: withoutLocale } = parseLocalePath(pathname);
	return localizedPath(targetLocale, withoutLocale);
}

export function getLocaleFromCookie(request: Request): Locale | null {
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) {
		return null;
	}

	for (const part of cookieHeader.split(';')) {
		const [rawName, ...rawValue] = part.trim().split('=');
		if (rawName === LANG_COOKIE) {
			const value = decodeURIComponent(rawValue.join('='));
			return isLocale(value) ? value : null;
		}
	}

	return null;
}

/** Parse Accept-Language; prefers Gujarati when listed with equal or higher q-value. */
export function parseAcceptLanguage(header: string | null): Locale {
	if (!header) {
		return DEFAULT_LOCALE;
	}

	let bestLocale: Locale = DEFAULT_LOCALE;
	let bestQuality = -1;

	for (const entry of header.split(',')) {
		const [tagPart, ...params] = entry.trim().split(';');
		const tag = tagPart.trim().toLowerCase();
		let quality = 1;

		for (const param of params) {
			const [key, value] = param.trim().split('=');
			if (key === 'q' && value) {
				const parsed = Number.parseFloat(value);
				if (!Number.isNaN(parsed)) {
					quality = parsed;
				}
			}
		}

		let locale: Locale | null = null;
		if (tag === 'gu' || tag.startsWith('gu-')) {
			locale = 'gu';
		} else if (tag === 'en' || tag.startsWith('en-')) {
			locale = 'en';
		}

		if (locale && quality > bestQuality) {
			bestLocale = locale;
			bestQuality = quality;
		}
	}

	return bestLocale;
}

export function resolvePreferredLocale(request: Request): Locale {
	return getLocaleFromCookie(request) ?? parseAcceptLanguage(request.headers.get('Accept-Language'));
}

/**
 * Locale routing middleware.
 * Returns a redirect Response, an I18nContext for localized pages, or null when exempt.
 */
export function resolveI18n(request: Request): Response | I18nContext | null {
	const url = new URL(request.url);
	const { pathname } = url;

	if (isI18nExemptPath(pathname)) {
		return null;
	}

	const parsed = parseLocalePath(pathname);

	if (parsed.locale) {
		return {
			locale: parsed.locale,
			pathname: parsed.pathname,
		};
	}

	const locale = resolvePreferredLocale(request);
	const destination = new URL(localizedPath(locale, pathname), url);
	destination.search = url.search;
	return Response.redirect(destination.toString(), 302);
}

export function localeLabel(locale: Locale): string {
	return locale === 'gu' ? 'ગુજરાતી' : 'English';
}

export function alternateLocale(locale: Locale): Locale {
	return locale === 'en' ? 'gu' : 'en';
}

export function htmlLang(locale: Locale): string {
	return locale === 'gu' ? 'gu' : 'en';
}
