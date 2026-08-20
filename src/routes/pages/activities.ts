import { renderPageShell } from '../../components/layout';
import { renderPublicForm, renderSubNav } from '../../components/public-page';
import type { Locale } from '../../lib/i18n';
import { localizedPath } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';
import { loadPageContent, pickLocalized, submittedFromUrl, dayName, pageHeading } from '../../lib/page-helpers';
import { ACTIVITY_PAGES, SANSKAR_PAGES } from '../../lib/site-structure';
import { uiCopy } from '../../lib/ui-copy';
import { siteCopy } from '../../lib/site';

type ScheduleRow = {
	name_en: string;
	name_gu: string | null;
	day_of_week: number;
	time: string;
	location: string | null;
	desc_en: string | null;
	desc_gu: string | null;
};

function activitiesNav(locale: Locale, pathname: string): string {
	const base = localizedPath(locale, '/activities');
	return renderSubNav(locale, [
		{ href: base, label: locale === 'gu' ? 'પ્રવૃત્તિઓ' : 'Overview', active: pathname === '/activities' },
		{
			href: `${base}/sanskaras`,
			label: locale === 'gu' ? 'સંસ્કાર' : 'Sanskaras',
			active: pathname.startsWith('/activities/sanskaras'),
		},
		...ACTIVITY_PAGES.map((p) => ({
			href: `${base}/${p.slug}`,
			label: pickLocalized(locale, p.labels),
			active: pathname === `/activities/${p.slug}`,
		})),
	]);
}

export async function renderActivitiesHub(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const base = localizedPath(locale, '/activities');
	const cards = [
		...ACTIVITY_PAGES.slice(0, 6).map(
			(p) =>
				`<a class="card card--link" href="${escapeHtml(`${base}/${p.slug}`)}"><h2 class="card-title">${escapeHtml(pickLocalized(locale, p.labels))}</h2></a>`,
		),
		`<a class="card card--link" href="${escapeHtml(`${base}/sanskaras`)}"><h2 class="card-title">${locale === 'gu' ? '૧૬ સંસ્કાર' : '16 Sanskaras'}</h2></a>`,
	].join('');

	const main = `<div class="container page-activities">
${activitiesNav(locale, '/activities')}
<h1 class="page-title">${locale === 'gu' ? 'પ્રવૃત્તિઓ' : 'Activities'}</h1>
<p class="lead">${locale === 'gu' ? 'યજ્ઞ, સાધના, શિક્ષણ અને સમુદાય સેવા.' : 'Yagya, sadhana, education, and community seva.'}</p>
<div class="card-grid">${cards}</div>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/activities',
		title: `${locale === 'gu' ? 'પ્રવૃત્તિઓ' : 'Activities'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderSanskarasIndex(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const base = localizedPath(locale, '/activities/sanskaras');
	const list = SANSKAR_PAGES.map(
		(s) =>
			`<li><a href="${escapeHtml(`${base}/${s.slug}`)}">${escapeHtml(pickLocalized(locale, s.labels))}</a></li>`,
	).join('');

	const main = `<div class="container page-activities">
${activitiesNav(locale, '/activities/sanskaras')}
<h1 class="page-title">${locale === 'gu' ? 'સોળ સંસ્કાર' : 'Sixteen Sanskaras'}</h1>
<ul class="link-list">${list}</ul>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/activities/sanskaras',
		title: `${locale === 'gu' ? 'સંસ્કાર' : 'Sanskaras'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderSanskarDetail(
	env: Env,
	locale: Locale,
	slug: string,
	origin: string,
	url: URL,
): Promise<string | null> {
	const sanskar = SANSKAR_PAGES.find((s) => s.slug === slug);
	if (!sanskar) return null;

	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const fb = {
		title: pickLocalized(locale, sanskar.labels),
		body:
			locale === 'gu'
				? 'આ સંસ્કાર વિશે વિગતવાર માહિતી ટૂંક સમયમાં.'
				: 'Detailed information about this Sanskar will be published soon.',
	};
	const content = await loadPageContent(env.DB, locale, {
		pageKey: sanskar.pageKey,
		fallbackTitle: fb.title,
		fallbackBody: fb.body,
	});
	const timing = await loadPageContent(env.DB, locale, {
		pageKey: sanskar.pageKey,
		titleKey: 'timing',
		bodyKey: 'timing',
		fallbackTitle: locale === 'gu' ? 'ઉમર / સમય' : 'Age / timing',
		fallbackBody: locale === 'gu' ? 'સંપર્ક કરીને જાણો' : 'Contact us for timing',
	});

	const form = renderPublicForm({
		formType: 'sanskar_request',
		locale,
		title: ui.sanskarRequest,
		submitted: submittedFromUrl(url),
		hiddenFields: { sanskar: sanskar.slug },
	});

	const main = `<div class="container page-activities">
${activitiesNav(locale, `/activities/sanskaras/${slug}`)}
<p class="page-back"><a href="${escapeHtml(localizedPath(locale, '/activities/sanskaras'))}">← ${escapeHtml(ui.backTo)} ${locale === 'gu' ? 'સંસ્કાર' : 'Sanskaras'}</a></p>
${pageHeading(content.title)}
<p class="sanskar-timing"><strong>${escapeHtml(timing.title)}:</strong> ${escapeHtml(timing.bodyHtml.replace(/<[^>]+>/g, ''))}</p>
${content.bodyHtml}
<section class="section">${form}</section>
</div>`;

	return renderPageShell({
		locale,
		pathname: `/activities/sanskaras/${slug}`,
		title: `${content.title} | ${copy.siteName}`,
		origin,
		main,
		translationPending: content.translationPending,
		env,
		url,
	});
}

export async function renderActivityDetail(
	env: Env,
	locale: Locale,
	slug: string,
	origin: string,
	url: URL,
): Promise<string | null> {
	const activity = ACTIVITY_PAGES.find((a) => a.slug === slug);
	if (!activity) return null;

	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const fb = {
		title: pickLocalized(locale, activity.labels),
		body:
			locale === 'gu'
				? 'આ પ્રવૃત્તિ વિશે વિગતવાર માહિતી ટૂંક સમયમાં.'
				: 'Detailed information about this activity will be published soon.',
	};
	const content = await loadPageContent(env.DB, locale, {
		pageKey: activity.pageKey,
		fallbackTitle: fb.title,
		fallbackBody: fb.body,
	});

	let extra = '';
	if (slug === 'daily-routine-aarti') {
		const rows = await env.DB.prepare(
			`SELECT * FROM regular_schedule WHERE name_en LIKE '%Aarti%' OR name_en LIKE '%Routine%' OR desc_en LIKE '%ritual%' OR desc_en LIKE '%Daily%' ORDER BY day_of_week, time`,
		).all<ScheduleRow>();
		const allRows =
			rows.results && rows.results.length > 0
				? rows.results
				: (
						await env.DB.prepare('SELECT * FROM regular_schedule ORDER BY day_of_week, time').all<ScheduleRow>()
					).results ?? [];

		const tableRows = allRows
			.map((row) => {
				const name = locale === 'gu' && row.name_gu ? row.name_gu : row.name_en;
				return `<tr>
				<td>${escapeHtml(dayName(locale, row.day_of_week))}</td>
				<td>${escapeHtml(name)}</td>
				<td>${escapeHtml(row.time)}</td>
				<td>${escapeHtml(row.location ?? '')}</td>
			</tr>`;
			})
			.join('');

		extra = `<section class="section" aria-labelledby="daily-rituals-title">
		<h2 id="daily-rituals-title" class="section-title">${locale === 'gu' ? 'દૈનિક દિનચર્યા / આરતી' : 'Daily rituals schedule'}</h2>
		<table class="data-table">
			<thead><tr><th>${locale === 'gu' ? 'દિવસ' : 'Day'}</th><th>${locale === 'gu' ? 'પ્રવૃત્તિ' : 'Activity'}</th><th>${locale === 'gu' ? 'સમય' : 'Time'}</th><th>${locale === 'gu' ? 'સ્થળ' : 'Location'}</th></tr></thead>
			<tbody>${tableRows}</tbody>
		</table>
	</section>`;
	}

	const form = renderPublicForm({
		formType: 'activity_connect',
		locale,
		title: ui.activityConnect,
		submitted: submittedFromUrl(url),
		hiddenFields: { activity: activity.slug },
	});

	const main = `<div class="container page-activities">
${activitiesNav(locale, `/activities/${slug}`)}
${pageHeading(content.title)}
${content.bodyHtml}
${extra}
<section class="section">${form}</section>
</div>`;

	return renderPageShell({
		locale,
		pathname: `/activities/${slug}`,
		title: `${content.title} | ${copy.siteName}`,
		origin,
		main,
		translationPending: content.translationPending,
		env,
		url,
	});
}
