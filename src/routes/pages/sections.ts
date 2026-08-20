import { renderPageShell } from '../../components/layout';
import { renderPublicForm } from '../../components/public-page';
import type { Locale } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';
import { loadPageContent, submittedFromUrl, pageHeading } from '../../lib/page-helpers';
import { uiCopy } from '../../lib/ui-copy';
import { siteCopy } from '../../lib/site';

type PhotoRow = { url: string; caption_en: string | null; caption_gu: string | null };

async function renderSectionPage(
	env: Env,
	locale: Locale,
	origin: string,
	url: URL,
	options: {
		pathname: string;
		pageKey: string;
		formType: string;
		photoTag: string;
		fallback: { title: string; body: string; stats: { label: string; value: string }[] };
	},
): Promise<string> {
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);

	const content = await loadPageContent(env.DB, locale, {
		pageKey: options.pageKey,
		fallbackTitle: options.fallback.title,
		fallbackBody: options.fallback.body,
	});

	const photos = await env.DB.prepare(
		'SELECT url, caption_en, caption_gu FROM gallery_photo WHERE activity_tag = ? ORDER BY id DESC LIMIT 12',
	)
		.bind(options.photoTag)
		.all<PhotoRow>();

	const photoGrid =
		photos.results
			?.map((p) => {
				const cap = locale === 'gu' && p.caption_gu ? p.caption_gu : p.caption_en ?? '';
				return `<figure class="photo-card"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(cap)}" loading="lazy" /></figure>`;
			})
			.join('') ?? '';

	const statsHtml = options.fallback.stats
		.map((s) => `<div class="stat-card"><span class="stat-card__value">${escapeHtml(s.value)}</span><span class="stat-card__label">${escapeHtml(s.label)}</span></div>`)
		.join('');

	const form = renderPublicForm({
		formType: options.formType,
		locale,
		title: ui.donationInterest,
		submitted: submittedFromUrl(url),
	});

	const main = `<div class="container page-section">
${pageHeading(content.title)}
${content.bodyHtml}
<section class="section" aria-labelledby="stats-title">
	<h2 id="stats-title" class="section-title">${escapeHtml(ui.stats)}</h2>
	<div class="stat-grid">${statsHtml}</div>
</section>
${photoGrid ? `<section class="section"><h2 class="section-title">${escapeHtml(ui.photos)}</h2><div class="photo-grid">${photoGrid}</div></section>` : ''}
<section class="section">${form}</section>
</div>`;

	return renderPageShell({
		locale,
		pathname: options.pathname,
		title: `${content.title} | ${copy.siteName}`,
		origin,
		main,
		translationPending: content.translationPending,
		env,
		url,
	});
}

export async function renderGaushalaPage(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	return renderSectionPage(env, locale, origin, url, {
		pathname: '/gaushala',
		pageKey: 'gaushala',
		formType: 'gaushala_donation',
		photoTag: 'gaushala',
		fallback: {
			title: locale === 'gu' ? 'ગૌશાળા' : 'Gaushala',
			body:
				locale === 'gu'
					? 'ગાય સેવા, જૈવિક સંભાળ અને ગૌ સેવાના અવસર.'
					: 'Cow seva, organic care, and opportunities to support Gau Seva at Sevatirth Bhorda.',
			stats: [
				{ label: locale === 'gu' ? 'ગાયો' : 'Cows cared for', value: '—' },
				{ label: locale === 'gu' ? 'જૈવિક ખેતી' : 'Organic farming', value: '—' },
				{ label: locale === 'gu' ? 'દૈનિક સેવા' : 'Daily seva', value: '—' },
			],
		},
	});
}

export async function renderGurukulPage(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	return renderSectionPage(env, locale, origin, url, {
		pathname: '/gurukul',
		pageKey: 'gurukul',
		formType: 'gurukul_donation',
		photoTag: 'gurukul',
		fallback: {
			title: locale === 'gu' ? 'ગુરુકુલ' : 'Gurukul',
			body:
				locale === 'gu'
					? 'મૂલ્ય આધારિત શિક્ષણ, સંસ્કાર અને યુવા વિકાસ.'
					: 'Values-based education, sanskar, and youth development rooted in Indian culture.',
			stats: [
				{ label: locale === 'gu' ? 'વિદ્યાર્થીઓ' : 'Students', value: '—' },
				{ label: locale === 'gu' ? 'કાર્યક્રમો' : 'Programs', value: '—' },
				{ label: locale === 'gu' ? 'દૈનિક સાધના' : 'Daily sadhana', value: '—' },
			],
		},
	});
}
