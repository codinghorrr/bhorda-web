import { renderPageShell } from '../../components/layout';
import type { Locale } from '../../lib/i18n';
import { localizedPath } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';
import { formatEventDate, dayName } from '../../lib/page-helpers';
import { refreshPastSpotlightEvents } from '../../lib/spotlight';
import { uiCopy } from '../../lib/ui-copy';
import { siteCopy } from '../../lib/site';

type EventRow = {
	id: string;
	type: string;
	title_en: string;
	title_gu: string | null;
	desc_en: string | null;
	desc_gu: string | null;
	date_start: string;
	date_end: string | null;
	location: string | null;
	photo_url: string | null;
	status: string;
};

type ScheduleRow = {
	name_en: string;
	name_gu: string | null;
	day_of_week: number;
	time: string;
	location: string | null;
	desc_en: string | null;
	desc_gu: string | null;
};

type VideoRow = {
	id: string;
	youtube_url: string;
	thumbnail_url: string | null;
	title_en: string;
	title_gu: string | null;
	desc_en: string | null;
	desc_gu: string | null;
	day_number: number | null;
};

type PhotoRow = {
	id: string;
	url: string;
	caption_en: string | null;
	caption_gu: string | null;
};

function pickTitle(row: { title_en: string; title_gu: string | null }, locale: Locale): string {
	return locale === 'gu' && row.title_gu ? row.title_gu : row.title_en;
}

function pickDesc(row: { desc_en: string | null; desc_gu: string | null }, locale: Locale): string {
	if (locale === 'gu' && row.desc_gu) return row.desc_gu;
	return row.desc_en ?? '';
}

function renderSpotlightCard(event: EventRow, locale: Locale): string {
	const title = pickTitle(event, locale);
	const href = localizedPath(locale, `/events/${event.id}`);
	const date = formatEventDate(locale, event.date_start, event.date_end);
	const photo = event.photo_url
		? `<img class="event-card__image" src="${escapeHtml(event.photo_url)}" alt="" loading="lazy" />`
		: '<div class="event-card__image event-card__image--placeholder" aria-hidden="true"></div>';
	const desc = pickDesc(event, locale);
	const excerpt = desc.length > 140 ? `${desc.slice(0, 140)}…` : desc;

	return `<article class="event-card event-card--spotlight">
	<a class="event-card__link" href="${escapeHtml(href)}">
		${photo}
		<div class="event-card__body">
			<p class="event-card__meta"><span class="badge">${escapeHtml(event.type)}</span> · ${escapeHtml(date)}</p>
			<h3 class="event-card__title">${escapeHtml(title)}</h3>
			${event.location ? `<p class="event-card__location">${escapeHtml(event.location)}</p>` : ''}
			${excerpt ? `<p class="event-card__excerpt">${escapeHtml(excerpt)}</p>` : ''}
		</div>
	</a>
</article>`;
}

export async function renderEventsPage(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	await refreshPastSpotlightEvents(env.DB);
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);

	const [upcoming, past, schedule] = await Promise.all([
		env.DB.prepare(
			`SELECT * FROM spotlight_events WHERE status != 'draft' AND status != 'past' ORDER BY date_start ASC`,
		).all<EventRow>(),
		env.DB.prepare(
			`SELECT * FROM spotlight_events WHERE status = 'past' ORDER BY date_start DESC LIMIT 12`,
		).all<EventRow>(),
		env.DB.prepare('SELECT * FROM regular_schedule ORDER BY day_of_week, time').all<ScheduleRow>(),
	]);

	const upcomingHtml =
		upcoming.results?.map((e) => renderSpotlightCard(e, locale)).join('') ||
		`<p class="muted">${locale === 'gu' ? 'હાલમાં કોઈ આગામી કાર્યક્રમ નથી.' : 'No upcoming spotlight events at the moment.'}</p>`;

	const pastHtml =
		past.results?.map((e) => renderSpotlightCard(e, locale)).join('') ||
		`<p class="muted">${locale === 'gu' ? 'ભૂતકાળના કાર્યક્રમો અહીં દેખાશે.' : 'Past events will appear here.'}</p>`;

	const scheduleByDay = new Map<number, ScheduleRow[]>();
	for (const row of schedule.results ?? []) {
		const list = scheduleByDay.get(row.day_of_week) ?? [];
		list.push(row);
		scheduleByDay.set(row.day_of_week, list);
	}

	const scheduleRows = [...scheduleByDay.entries()]
		.sort(([a], [b]) => a - b)
		.map(([day, items]) => {
			const rows = items
				.map((item) => {
					const name = locale === 'gu' && item.name_gu ? item.name_gu : item.name_en;
					const desc = locale === 'gu' && item.desc_gu ? item.desc_gu : item.desc_en ?? '';
					return `<tr>
				<td>${escapeHtml(name)}</td>
				<td>${escapeHtml(item.time)}</td>
				<td>${escapeHtml(item.location ?? '')}</td>
				<td>${escapeHtml(desc)}</td>
			</tr>`;
				})
				.join('');
			return `<tbody>
			<tr class="schedule-day"><th colspan="4">${escapeHtml(dayName(locale, day))}</th></tr>
			${rows}
		</tbody>`;
		})
		.join('');

	const main = `<div class="container page-events">
<h1 class="page-title">${locale === 'gu' ? 'કાર્યક્રમો' : 'Events'}</h1>
<p class="lead">${locale === 'gu' ? 'સ્પોટલાઇટ કાર્યક્રમો અને નિયમિત સાપ્તાહિક સમયપત્રક.' : 'Spotlight events and the regular weekly schedule. Daily rituals are listed under Activities → Daily Routine / Aarti.'}</p>

<section class="events-section events-section--spotlight" aria-labelledby="events-spotlight-title">
	<h2 id="events-spotlight-title" class="section-title section-title--spotlight">${escapeHtml(ui.spotlightEvents)}</h2>
	<div class="event-grid">${upcomingHtml}</div>
</section>

<section class="events-section events-section--past" aria-labelledby="events-past-title">
	<h2 id="events-past-title" class="section-title">${escapeHtml(ui.past)}</h2>
	<div class="event-grid event-grid--compact">${pastHtml}</div>
</section>

<section class="events-section events-section--schedule" aria-labelledby="events-schedule-title">
	<h2 id="events-schedule-title" class="section-title section-title--schedule">${escapeHtml(ui.regularSchedule)}</h2>
	<table class="data-table schedule-table">
		<thead><tr><th>${locale === 'gu' ? 'પ્રવૃત્તિ' : 'Activity'}</th><th>${locale === 'gu' ? 'સમય' : 'Time'}</th><th>${locale === 'gu' ? 'સ્થળ' : 'Location'}</th><th>${locale === 'gu' ? 'વર્ણન' : 'Description'}</th></tr></thead>
		${scheduleRows || `<tbody><tr><td colspan="4">${locale === 'gu' ? 'સમયપત્રક ટૂંક સમયમાં.' : 'Schedule coming soon.'}</td></tr></tbody>`}
	</table>
</section>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/events',
		title: `${locale === 'gu' ? 'કાર્યક્રમો' : 'Events'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderEventDetail(
	env: Env,
	locale: Locale,
	eventId: string,
	origin: string,
	url: URL,
): Promise<string | null> {
	await refreshPastSpotlightEvents(env.DB);
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);

	const event = await env.DB.prepare('SELECT * FROM spotlight_events WHERE id = ?').bind(eventId).first<EventRow>();
	if (!event || event.status === 'draft') return null;

	const [videos, photos] = await Promise.all([
		env.DB.prepare(
			'SELECT * FROM gallery_video WHERE event_id = ? ORDER BY day_number ASC, title_en ASC',
		)
			.bind(eventId)
			.all<VideoRow>(),
		env.DB.prepare('SELECT id, url, caption_en, caption_gu FROM gallery_photo WHERE event_id = ?').bind(eventId).all<PhotoRow>(),
	]);

	const title = pickTitle(event, locale);
	const desc = pickDesc(event, locale);
	const date = formatEventDate(locale, event.date_start, event.date_end);
	const isKatha = event.type === 'Katha';

	const videoItems = videos.results ?? [];
	const photoItems = photos.results ?? [];

	let mediaSection = '';
	if (isKatha && videoItems.length > 0) {
		const playlist = videoItems
			.map((v) => {
				const vTitle = pickTitle(v, locale);
				const day = v.day_number != null ? `${locale === 'gu' ? 'દિવસ' : 'Day'} ${v.day_number}: ` : '';
				const thumb = v.thumbnail_url
					? `<img src="${escapeHtml(v.thumbnail_url)}" alt="" loading="lazy" />`
					: '<div class="video-card__thumb-placeholder"></div>';
				return `<li class="katha-playlist__item">
			<a class="video-card" href="${escapeHtml(v.youtube_url)}" target="_blank" rel="noopener noreferrer">
				${thumb}
				<span class="video-card__title">${escapeHtml(day)}${escapeHtml(vTitle)}</span>
				<span class="video-card__cta">${escapeHtml(ui.viewOnYoutube)}</span>
			</a>
		</li>`;
			})
			.join('');
		mediaSection += `<section class="section" aria-labelledby="event-videos-title">
		<h2 id="event-videos-title" class="section-title">${locale === 'gu' ? 'કથા પ્લેલિસ્ટ' : 'Katha playlist'}</h2>
		<ol class="katha-playlist">${playlist}</ol>
	</section>`;
	} else if (videoItems.length > 0) {
		mediaSection += `<section class="section" aria-labelledby="event-videos-title">
		<h2 id="event-videos-title" class="section-title">${locale === 'gu' ? 'વિડિયો' : 'Videos'}</h2>
		<ul class="video-grid">${videoItems
			.map(
				(v) =>
					`<li><a class="video-card" href="${escapeHtml(v.youtube_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pickTitle(v, locale))} — ${escapeHtml(ui.viewOnYoutube)}</a></li>`,
			)
			.join('')}</ul>
	</section>`;
	} else if (isKatha) {
		mediaSection += `<p class="empty-state">${escapeHtml(ui.noVideos)}</p>`;
	}

	if (photoItems.length > 0) {
		mediaSection += `<section class="section" aria-labelledby="event-photos-title">
		<h2 id="event-photos-title" class="section-title">${escapeHtml(ui.photos)}</h2>
		<div class="photo-grid">${photoItems
			.map((p) => {
				const cap = locale === 'gu' && p.caption_gu ? p.caption_gu : p.caption_en ?? '';
				return `<figure class="photo-card"><img src="${escapeHtml(p.url)}" alt="${escapeHtml(cap)}" loading="lazy" />${cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''}</figure>`;
			})
			.join('')}</div>
	</section>`;
	} else if (isKatha && videoItems.length === 0) {
		mediaSection += `<p class="empty-state">${escapeHtml(ui.noMedia)}</p>`;
	} else if (isKatha) {
		mediaSection += `<p class="empty-state muted">${escapeHtml(ui.noPhotos)}</p>`;
	}

	const hero = event.photo_url
		? `<img class="event-detail__hero" src="${escapeHtml(event.photo_url)}" alt="" />`
		: '';

	const main = `<div class="container page-event-detail">
<p class="page-back"><a href="${escapeHtml(localizedPath(locale, '/events'))}">← ${escapeHtml(ui.backTo)} ${locale === 'gu' ? 'કાર્યક્રમો' : 'Events'}</a></p>
${hero}
<h1 class="page-title">${escapeHtml(title)}</h1>
<p class="event-detail__meta"><span class="badge">${escapeHtml(event.type)}</span> · ${escapeHtml(date)}${event.location ? ` · ${escapeHtml(event.location)}` : ''}</p>
${desc ? `<div class="rich-text">${desc.split('\n').map((l) => `<p>${escapeHtml(l)}</p>`).join('')}</div>` : ''}
${mediaSection}
</div>`;

	return renderPageShell({
		locale,
		pathname: `/events/${eventId}`,
		title: `${title} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}
