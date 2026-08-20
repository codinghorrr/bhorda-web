import type { Locale } from './i18n';
import { escapeHtml } from './html';

export type ResolvedContent = {
	text: string;
	translationPending: boolean;
};

type PageTextRow = {
	content_en: string | null;
	content_gu: string | null;
};

/**
 * Resolve a page_text block for the requested locale.
 * Gujarati falls back to English with translationPending when GU content is absent.
 */
export async function getPageText(
	db: D1Database,
	pageKey: string,
	blockKey: string,
	locale: Locale,
): Promise<ResolvedContent> {
	try {
		const row = await db
			.prepare('SELECT content_en, content_gu FROM page_text WHERE page_key = ? AND block_key = ?')
			.bind(pageKey, blockKey)
			.first<PageTextRow>();

		if (!row) {
			return { text: '', translationPending: false };
		}

		const english = (row.content_en ?? '').trim();
		const gujarati = (row.content_gu ?? '').trim();

		if (locale === 'gu') {
			if (gujarati) {
				return { text: gujarati, translationPending: false };
			}
			return {
				text: english,
				translationPending: english.length > 0,
			};
		}

		return { text: english, translationPending: false };
	} catch {
		// Uninitialized local D1 or query failure — caller supplies static fallbacks.
		return { text: '', translationPending: false };
	}
}

export async function getPageTexts(
	db: D1Database,
	pageKey: string,
	blockKeys: readonly string[],
	locale: Locale,
): Promise<Record<string, ResolvedContent>> {
	const entries = await Promise.all(
		blockKeys.map(async (blockKey) => [blockKey, await getPageText(db, pageKey, blockKey, locale)] as const),
	);
	return Object.fromEntries(entries);
}

export function renderTranslationPendingNotice(locale: Locale, labels: { en: string; gu: string }): string {
	if (locale !== 'gu') {
		return '';
	}

	return `<p class="translation-pending" role="status">${escapeHtml(labels.gu)}</p>`;
}

export function renderResolvedBlock(
	content: ResolvedContent,
	locale: Locale,
	labels: { pendingEn: string; pendingGu: string },
): string {
	const notice =
		content.translationPending
			? renderTranslationPendingNotice(locale, { en: labels.pendingEn, gu: labels.pendingGu })
			: '';

	if (!content.text) {
		return notice;
	}

	return `${notice}<div class="resolved-block">${content.text}</div>`;
}
