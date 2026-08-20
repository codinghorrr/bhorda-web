import type { AuthSession } from '../../lib/auth';
import { randomId } from '../../lib/crypto';
import { escapeHtml } from '../../lib/html';
import { processPhotoUpload } from '../../lib/images';
import { publicMediaUrl, putObject } from '../../lib/r2';
import { computeSpotlightStatus, refreshPastSpotlightEvents, SPOTLIGHT_TYPES } from '../../lib/spotlight';
import { PHOTO_UPLOAD, validateUpload } from '../../lib/uploads';
import { actions, alert, field, hidden, select } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

const STATUS_OPTIONS = [
	{ value: 'draft', label: 'Draft (manual)' },
	{ value: 'published', label: 'Published (auto-past after end date)' },
];

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

export async function handleEventsRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/events')) {
		return null;
	}

	await refreshPastSpotlightEvents(env.DB);

	if (pathname === '/vedmata/events' && request.method === 'GET') {
		return listEvents(request, env, session);
	}
	if (pathname === '/vedmata/events/new' && request.method === 'GET') {
		return formEvent(request, env, session, null);
	}
	if (pathname === '/vedmata/events' && request.method === 'POST') {
		return saveEvent(request, env, session, null);
	}

	const editMatch = /^\/vedmata\/events\/([^/]+)\/edit$/.exec(pathname);
	if (editMatch && request.method === 'GET') {
		return formEvent(request, env, session, editMatch[1]!);
	}

	const updateMatch = /^\/vedmata\/events\/([^/]+)$/.exec(pathname);
	if (updateMatch && request.method === 'POST') {
		return saveEvent(request, env, session, updateMatch[1]!);
	}

	const deleteMatch = /^\/vedmata\/events\/([^/]+)\/delete$/.exec(pathname);
	if (deleteMatch && request.method === 'POST') {
		return deleteEvent(request, env, session, deleteMatch[1]!);
	}

	return adminHtmlNotFound();
}

function adminHtmlNotFound(): Response {
	return adminHtmlResponse('Not Found', { status: 404 });
}

async function listEvents(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare(
		'SELECT id, type, title_en, date_start, date_end, location, status FROM spotlight_events ORDER BY date_start DESC',
	).all<Pick<EventRow, 'id' | 'type' | 'title_en' | 'date_start' | 'date_end' | 'location' | 'status'>>();

	const items =
		rows.results
			?.map((row) => {
				const range = row.date_end ? `${row.date_start} → ${row.date_end}` : row.date_start;
				return `<tr>
			<td>${escapeHtml(row.title_en)}</td>
			<td>${escapeHtml(row.type)}</td>
			<td>${escapeHtml(range)}</td>
			<td>${escapeHtml(row.location ?? '')}</td>
			<td><span class="admin-badge">${escapeHtml(row.status)}</span></td>
			<td class="admin-table-actions">
				<a href="/vedmata/events/${escapeHtml(row.id)}/edit">Edit</a>
			</td>
		</tr>`;
			})
			.join('') ?? '';

	const content = `<div class="admin-toolbar"><a class="btn btn--gold" href="/vedmata/events/new">New event</a></div>
<table class="admin-table">
	<thead><tr><th>Title</th><th>Type</th><th>Date(s)</th><th>Location</th><th>Status</th><th></th></tr></thead>
	<tbody>${items || '<tr><td colspan="6">No events yet.</td></tr>'}</tbody>
</table>`;

	return renderAdminPage(request, env, { session, title: 'Spotlight Events', activePath: '/vedmata/events', content });
}

async function formEvent(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: EventRow | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM spotlight_events WHERE id = ?').bind(id).first<EventRow>();
		if (!row) {
			return adminRedirect('/vedmata/events');
		}
	}

	const action = id ? `/vedmata/events/${id}` : '/vedmata/events';
	const content = `${alert('Dates use YYYY-MM-DD. Leave end date empty for single-day events.', 'info')}
<form class="admin-form admin-form--wide" method="post" action="${action}" enctype="multipart/form-data">
${hidden('csrf_token', csrf)}
${select('Type', 'type', row?.type ?? 'Event', SPOTLIGHT_TYPES.map((t) => ({ value: t, label: t })))}
${field('Title (English)', 'title_en', row?.title_en ?? '', { required: true })}
${field('Title (Gujarati)', 'title_gu', row?.title_gu ?? '')}
${field('Description (English)', 'desc_en', row?.desc_en ?? '', { type: 'textarea' })}
${field('Description (Gujarati)', 'desc_gu', row?.desc_gu ?? '', { type: 'textarea' })}
${field('Start date', 'date_start', row?.date_start ?? '', { type: 'date', required: true })}
${field('End date (optional, for Katha ranges)', 'date_end', row?.date_end ?? '', { type: 'date' })}
${field('Location', 'location', row?.location ?? '')}
${select('Status', 'status', row?.status === 'draft' ? 'draft' : 'published', STATUS_OPTIONS)}
<label class="admin-label" for="photo">Event photo (optional)</label>
<input class="admin-input" id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
${row?.photo_url ? `<p class="admin-form-hint">Current: <a href="${escapeHtml(row.photo_url)}" target="_blank" rel="noopener">view</a></p>` : ''}
${actions(id ? 'Update event' : 'Create event')}
</form>
${id ? `<form method="post" action="/vedmata/events/${escapeHtml(id)}/delete" onsubmit="return confirm('Delete this event?')">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit event' : 'New event',
		activePath: '/vedmata/events',
		content,
	});
}

async function saveEvent(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return renderAdminPage(request, env, {
			session,
			title: 'Spotlight Events',
			activePath: '/vedmata/events',
			content: alert('Invalid CSRF token.', 'error'),
			status: 403,
		});
	}

	const type = String(form.get('type') ?? 'Event');
	const titleEn = String(form.get('title_en') ?? '').trim();
	const titleGu = String(form.get('title_gu') ?? '').trim();
	const descEn = String(form.get('desc_en') ?? '').trim();
	const descGu = String(form.get('desc_gu') ?? '').trim();
	const dateStart = String(form.get('date_start') ?? '').trim();
	const dateEnd = String(form.get('date_end') ?? '').trim() || null;
	const location = String(form.get('location') ?? '').trim() || null;
	let status = String(form.get('status') ?? 'published') as 'draft' | 'published' | 'past';

	if (!titleEn || !dateStart) {
		return formEvent(request, env, session, id);
	}

	if (status !== 'draft') {
		status = computeSpotlightStatus(dateStart, dateEnd);
	}

	const eventId = id ?? randomId('evt');
	let photoUrl: string | null = null;
	if (id) {
		const existing = await env.DB.prepare('SELECT photo_url FROM spotlight_events WHERE id = ?').bind(id).first<{ photo_url: string | null }>();
		photoUrl = existing?.photo_url ?? null;
	}

	const photo = form.get('photo');
	if (photo instanceof File && photo.size > 0) {
		const err = validateUpload(photo, PHOTO_UPLOAD);
		if (err) {
			return renderAdminPage(request, env, {
				session,
				title: 'Spotlight Events',
				activePath: '/vedmata/events',
				content: alert(err, 'error'),
			});
		}
		const processed = await processPhotoUpload(photo);
		const key = `events/${eventId}.jpg`;
		await putObject(env.MEDIA, key, processed.data, processed.contentType);
		photoUrl = publicMediaUrl(key);
	}

	if (id) {
		await env.DB.prepare(
			`UPDATE spotlight_events SET type=?, title_en=?, title_gu=?, desc_en=?, desc_gu=?, date_start=?, date_end=?, location=?, photo_url=?, status=? WHERE id=?`,
		)
			.bind(type, titleEn, titleGu || null, descEn || null, descGu || null, dateStart, dateEnd, location, photoUrl, status, id)
			.run();
	} else {
		await env.DB.prepare(
			`INSERT INTO spotlight_events (id, type, title_en, title_gu, desc_en, desc_gu, date_start, date_end, location, photo_url, status)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(eventId, type, titleEn, titleGu || null, descEn || null, descGu || null, dateStart, dateEnd, location, photoUrl, status)
			.run();
	}

	return adminRedirect('/vedmata/events');
}

async function deleteEvent(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlNotFound();
	}
	await env.DB.prepare('DELETE FROM spotlight_events WHERE id = ?').bind(id).run();
	return adminRedirect('/vedmata/events');
}
