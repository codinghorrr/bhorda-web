import type { Locale } from '../lib/i18n';
import { getPageText } from '../lib/content';
import { escapeHtml } from '../lib/html';
import { textToParagraphs } from '../components/public-page';

type PageContentOptions = {
	pageKey: string;
	titleKey?: string;
	bodyKey?: string;
	fallbackTitle: string;
	fallbackBody: string;
};

export async function loadPageContent(
	db: D1Database,
	locale: Locale,
	options: PageContentOptions,
): Promise<{ title: string; bodyHtml: string; translationPending: boolean }> {
	const titleKey = options.titleKey ?? 'title';
	const bodyKey = options.bodyKey ?? 'body';

	const [titleBlock, bodyBlock] = await Promise.all([
		getPageText(db, options.pageKey, titleKey, locale),
		getPageText(db, options.pageKey, bodyKey, locale),
	]);

	const title = titleBlock.text || options.fallbackTitle;
	const body = bodyBlock.text || options.fallbackBody;
	const translationPending = titleBlock.translationPending || bodyBlock.translationPending;

	return {
		title,
		bodyHtml: textToParagraphs(body),
		translationPending,
	};
}

export function pickLocalized<T extends { en: string; gu: string }>(locale: Locale, labels: T): string {
	return locale === 'gu' && labels.gu ? labels.gu : labels.en;
}

export function formatEventDate(
	locale: Locale,
	dateStart: string,
	dateEnd: string | null,
): string {
	if (dateEnd && dateEnd !== dateStart) {
		return `${dateStart} – ${dateEnd}`;
	}
	return dateStart;
}

export function dayName(locale: Locale, day: number): string {
	const en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const gu = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'];
	return (locale === 'gu' ? gu : en)[day] ?? String(day);
}

export function submittedFromUrl(url: URL): boolean {
	return url.searchParams.get('submitted') === '1';
}

export function pageHeading(title: string, lead?: string): string {
	const leadHtml = lead ? `<p class="lead">${escapeHtml(lead)}</p>` : '';
	return `<h1 class="page-title">${escapeHtml(title)}</h1>${leadHtml}`;
}
