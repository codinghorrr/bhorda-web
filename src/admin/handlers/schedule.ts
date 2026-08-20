import type { AuthSession } from '../../lib/auth';
import { randomId } from '../../lib/crypto';
import { escapeHtml } from '../../lib/html';
import { actions, alert, field, hidden, select } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

const DAYS = [
	{ value: '0', label: 'Sunday' },
	{ value: '1', label: 'Monday' },
	{ value: '2', label: 'Tuesday' },
	{ value: '3', label: 'Wednesday' },
	{ value: '4', label: 'Thursday' },
	{ value: '5', label: 'Friday' },
	{ value: '6', label: 'Saturday' },
];

type Row = {
	id: string;
	name_en: string;
	name_gu: string | null;
	day_of_week: number;
	time: string;
	location: string | null;
	desc_en: string | null;
	desc_gu: string | null;
};

export async function handleScheduleRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/schedule')) {
		return null;
	}

	if (pathname === '/vedmata/schedule' && request.method === 'GET') {
		return list(request, env, session);
	}
	if (pathname === '/vedmata/schedule/new' && request.method === 'GET') {
		return form(request, env, session, null);
	}
	if (pathname === '/vedmata/schedule' && request.method === 'POST') {
		return save(request, env, session, null);
	}

	const edit = /^\/vedmata\/schedule\/([^/]+)\/edit$/.exec(pathname);
	if (edit && request.method === 'GET') {
		return form(request, env, session, edit[1]!);
	}
	const update = /^\/vedmata\/schedule\/([^/]+)$/.exec(pathname);
	if (update && request.method === 'POST') {
		return save(request, env, session, update[1]!);
	}
	const del = /^\/vedmata\/schedule\/([^/]+)\/delete$/.exec(pathname);
	if (del && request.method === 'POST') {
		return remove(request, env, session, del[1]!);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function list(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare('SELECT * FROM regular_schedule ORDER BY day_of_week, time').all<Row>();
	const dayName = (d: number) => DAYS.find((x) => Number(x.value) === d)?.label ?? String(d);
	const items =
		rows.results
			?.map(
				(r) => `<tr>
			<td>${escapeHtml(r.name_en)}</td>
			<td>${escapeHtml(dayName(r.day_of_week))}</td>
			<td>${escapeHtml(r.time)}</td>
			<td>${escapeHtml(r.location ?? '')}</td>
			<td><a href="/vedmata/schedule/${escapeHtml(r.id)}/edit">Edit</a></td>
		</tr>`,
			)
			.join('') ?? '';

	return renderAdminPage(request, env, {
		session,
		title: 'Regular Schedule',
		activePath: '/vedmata/schedule',
		content: `<div class="admin-toolbar"><a class="btn btn--gold" href="/vedmata/schedule/new">Add item</a></div>
<table class="admin-table"><thead><tr><th>Activity</th><th>Day</th><th>Time</th><th>Location</th><th></th></tr></thead>
<tbody>${items || '<tr><td colspan="5">No schedule items yet.</td></tr>'}</tbody></table>`,
	});
}

async function form(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: Row | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM regular_schedule WHERE id = ?').bind(id).first<Row>();
		if (!row) return adminRedirect('/vedmata/schedule');
	}
	const action = id ? `/vedmata/schedule/${id}` : '/vedmata/schedule';
	const content = `<form class="admin-form admin-form--wide" method="post" action="${action}">
${hidden('csrf_token', csrf)}
${field('Name (English)', 'name_en', row?.name_en ?? '', { required: true })}
${field('Name (Gujarati)', 'name_gu', row?.name_gu ?? '')}
${select('Day of week', 'day_of_week', String(row?.day_of_week ?? 0), DAYS)}
${field('Time', 'time', row?.time ?? '', { required: true, placeholder: '06:30' })}
${field('Location', 'location', row?.location ?? '')}
${field('Description (English)', 'desc_en', row?.desc_en ?? '', { type: 'textarea' })}
${field('Description (Gujarati)', 'desc_gu', row?.desc_gu ?? '', { type: 'textarea' })}
${actions(id ? 'Update' : 'Create')}
</form>
${id ? `<form method="post" action="/vedmata/schedule/${escapeHtml(id)}/delete">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit schedule item' : 'New schedule item',
		activePath: '/vedmata/schedule',
		content,
	});
}

async function save(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const formData = await request.formData();
	if (!(await validateAdminPost(request, env, formData))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}
	const nameEn = String(formData.get('name_en') ?? '').trim();
	const nameGu = String(formData.get('name_gu') ?? '').trim() || null;
	const day = Number(formData.get('day_of_week'));
	const time = String(formData.get('time') ?? '').trim();
	const location = String(formData.get('location') ?? '').trim() || null;
	const descEn = String(formData.get('desc_en') ?? '').trim() || null;
	const descGu = String(formData.get('desc_gu') ?? '').trim() || null;
	if (!nameEn || !time || day < 0 || day > 6) {
		return form(request, env, session, id);
	}
	const rowId = id ?? randomId('sch');
	if (id) {
		await env.DB.prepare(
			'UPDATE regular_schedule SET name_en=?, name_gu=?, day_of_week=?, time=?, location=?, desc_en=?, desc_gu=? WHERE id=?',
		)
			.bind(nameEn, nameGu, day, time, location, descEn, descGu, id)
			.run();
	} else {
		await env.DB.prepare(
			'INSERT INTO regular_schedule (id, name_en, name_gu, day_of_week, time, location, desc_en, desc_gu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		)
			.bind(rowId, nameEn, nameGu, day, time, location, descEn, descGu)
			.run();
	}
	return adminRedirect('/vedmata/schedule');
}

async function remove(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}
	await env.DB.prepare('DELETE FROM regular_schedule WHERE id = ?').bind(id).run();
	return adminRedirect('/vedmata/schedule');
}
