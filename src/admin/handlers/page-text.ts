import type { AuthSession } from '../../lib/auth';
import { randomId } from '../../lib/crypto';
import { escapeHtml } from '../../lib/html';
import { actions, alert, field, hidden } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

const PAGE_KEY_SUGGESTIONS = ['home', 'about', 'contact', 'gaushala', 'gurukul'] as const;

type PageTextRow = {
	id: string;
	page_key: string;
	block_key: string;
	content_en: string | null;
	content_gu: string | null;
};

type TimelineRow = {
	id: string;
	year: number;
	title_en: string;
	title_gu: string | null;
	desc_en: string | null;
	desc_gu: string | null;
	image_url: string | null;
	sort_order: number;
};

export async function handlePageTextRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/page-text')) {
		return null;
	}

	if (pathname.startsWith('/vedmata/page-text/timeline')) {
		return handleTimelineRoutes(request, env, session, pathname);
	}

	if (pathname === '/vedmata/page-text' && request.method === 'GET') {
		return listPageText(request, env, session);
	}
	if (pathname === '/vedmata/page-text/edit' && request.method === 'GET') {
		return editPageTextForm(request, env, session);
	}
	if (pathname === '/vedmata/page-text/edit' && request.method === 'POST') {
		return savePageText(request, env, session);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function listPageText(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare(
		'SELECT id, page_key, block_key, content_en, content_gu FROM page_text ORDER BY page_key, block_key',
	).all<PageTextRow>();

	const items =
		rows.results
			?.map((r) => {
				const preview = (r.content_en ?? '').trim().slice(0, 80);
				const suffix = (r.content_en ?? '').length > 80 ? '…' : '';
				return `<tr>
			<td>${escapeHtml(r.page_key)}</td>
			<td>${escapeHtml(r.block_key)}</td>
			<td>${escapeHtml(preview)}${suffix}</td>
			<td><a href="/vedmata/page-text/edit?page=${encodeURIComponent(r.page_key)}&amp;block=${encodeURIComponent(r.block_key)}">Edit</a></td>
		</tr>`;
			})
			.join('') ?? '';

	const content = `<div class="admin-toolbar">
	<a class="btn btn--gold" href="/vedmata/page-text/edit">New block</a>
	<a class="btn btn--ghost" href="/vedmata/page-text/timeline">Timeline editor</a>
</div>
<table class="admin-table">
	<thead><tr><th>Page</th><th>Block</th><th>Preview (EN)</th><th></th></tr></thead>
	<tbody>${items || '<tr><td colspan="4">No page text blocks yet.</td></tr>'}</tbody>
</table>
<p class="admin-form-hint">Suggested page keys: ${PAGE_KEY_SUGGESTIONS.map((k) => escapeHtml(k)).join(', ')}</p>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Page Text',
		activePath: '/vedmata/page-text',
		content,
	});
}

async function editPageTextForm(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const url = new URL(request.url);
	const pageKey = url.searchParams.get('page')?.trim() ?? '';
	const blockKey = url.searchParams.get('block')?.trim() ?? '';
	const csrf = await getCsrfToken(env);

	let row: PageTextRow | null = null;
	if (pageKey && blockKey) {
		row = await env.DB.prepare('SELECT * FROM page_text WHERE page_key = ? AND block_key = ?')
			.bind(pageKey, blockKey)
			.first<PageTextRow>();
	}

	const isNew = !row;
	const pageField = isNew
		? `<label class="admin-label" for="page_key">Page key</label>
<input class="admin-input" id="page_key" name="page_key" list="page-key-suggestions" value="${escapeHtml(pageKey)}" required />
<datalist id="page-key-suggestions">${PAGE_KEY_SUGGESTIONS.map((k) => `<option value="${escapeHtml(k)}"></option>`).join('')}</datalist>`
		: `${hidden('page_key', pageKey)}<p class="admin-form-hint">Page: <strong>${escapeHtml(pageKey)}</strong></p>`;

	const blockField = isNew
		? field('Block key', 'block_key', blockKey, { required: true, placeholder: 'hero_title' })
		: `${hidden('block_key', blockKey)}<p class="admin-form-hint">Block: <strong>${escapeHtml(blockKey)}</strong></p>`;

	const content = `<p><a href="/vedmata/page-text">← Back to list</a> · <a href="/vedmata/page-text/timeline">Timeline editor</a></p>
<form class="admin-form admin-form--wide" method="post" action="/vedmata/page-text/edit">
${hidden('csrf_token', csrf)}
${pageField}
${blockField}
${field('Content (English)', 'content_en', row?.content_en ?? '', { type: 'textarea', rows: 8 })}
${field('Content (Gujarati)', 'content_gu', row?.content_gu ?? '', { type: 'textarea', rows: 8 })}
${actions(isNew ? 'Create block' : 'Update block')}
</form>`;

	return renderAdminPage(request, env, {
		session,
		title: isNew ? 'New page text block' : `Edit ${pageKey} / ${blockKey}`,
		activePath: '/vedmata/page-text',
		content,
	});
}

async function savePageText(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const pageKey = String(form.get('page_key') ?? '').trim();
	const blockKey = String(form.get('block_key') ?? '').trim();
	const contentEn = String(form.get('content_en') ?? '').trim() || null;
	const contentGu = String(form.get('content_gu') ?? '').trim() || null;

	if (!pageKey || !blockKey) {
		return renderAdminPage(request, env, {
			session,
			title: 'Page Text',
			activePath: '/vedmata/page-text',
			content: alert('Page key and block key are required.', 'error'),
		});
	}

	const existing = await env.DB.prepare('SELECT id FROM page_text WHERE page_key = ? AND block_key = ?')
		.bind(pageKey, blockKey)
		.first<{ id: string }>();

	if (existing) {
		await env.DB.prepare('UPDATE page_text SET content_en=?, content_gu=? WHERE id=?')
			.bind(contentEn, contentGu, existing.id)
			.run();
	} else {
		await env.DB.prepare(
			'INSERT INTO page_text (id, page_key, block_key, content_en, content_gu) VALUES (?, ?, ?, ?, ?)',
		)
			.bind(randomId('ptx'), pageKey, blockKey, contentEn, contentGu)
			.run();
	}

	return adminRedirect('/vedmata/page-text');
}

async function handleTimelineRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (pathname === '/vedmata/page-text/timeline' && request.method === 'GET') {
		return listTimeline(request, env, session);
	}
	if (pathname === '/vedmata/page-text/timeline/new' && request.method === 'GET') {
		return timelineForm(request, env, session, null);
	}
	if (pathname === '/vedmata/page-text/timeline' && request.method === 'POST') {
		return saveTimeline(request, env, session, null);
	}

	const edit = /^\/vedmata\/page-text\/timeline\/([^/]+)\/edit$/.exec(pathname);
	if (edit && request.method === 'GET') {
		return timelineForm(request, env, session, edit[1]!);
	}
	const update = /^\/vedmata\/page-text\/timeline\/([^/]+)$/.exec(pathname);
	if (update && request.method === 'POST') {
		return saveTimeline(request, env, session, update[1]!);
	}
	const del = /^\/vedmata\/page-text\/timeline\/([^/]+)\/delete$/.exec(pathname);
	if (del && request.method === 'POST') {
		return removeTimeline(request, env, session, del[1]!);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function listTimeline(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare(
		'SELECT id, year, title_en, sort_order FROM timeline_events ORDER BY sort_order, year',
	).all<Pick<TimelineRow, 'id' | 'year' | 'title_en' | 'sort_order'>>();

	const items =
		rows.results
			?.map(
				(r) => `<tr>
			<td>${escapeHtml(String(r.sort_order))}</td>
			<td>${escapeHtml(String(r.year))}</td>
			<td>${escapeHtml(r.title_en)}</td>
			<td><a href="/vedmata/page-text/timeline/${escapeHtml(r.id)}/edit">Edit</a></td>
		</tr>`,
			)
			.join('') ?? '';

	const content = `<p><a href="/vedmata/page-text">← Back to page text</a></p>
<div class="admin-toolbar"><a class="btn btn--gold" href="/vedmata/page-text/timeline/new">Add timeline event</a></div>
<table class="admin-table">
	<thead><tr><th>Order</th><th>Year</th><th>Title (EN)</th><th></th></tr></thead>
	<tbody>${items || '<tr><td colspan="4">No timeline events yet.</td></tr>'}</tbody>
</table>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Timeline Events',
		activePath: '/vedmata/page-text',
		content,
	});
}

async function timelineForm(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: TimelineRow | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM timeline_events WHERE id = ?').bind(id).first<TimelineRow>();
		if (!row) return adminRedirect('/vedmata/page-text/timeline');
	}

	const action = id ? `/vedmata/page-text/timeline/${id}` : '/vedmata/page-text/timeline';
	const content = `<p><a href="/vedmata/page-text/timeline">← Back to timeline</a></p>
<form class="admin-form admin-form--wide" method="post" action="${action}">
${hidden('csrf_token', csrf)}
${field('Year', 'year', row ? String(row.year) : '', { type: 'number', required: true })}
${field('Sort order', 'sort_order', row ? String(row.sort_order) : '0', { type: 'number', required: true })}
${field('Title (English)', 'title_en', row?.title_en ?? '', { required: true })}
${field('Title (Gujarati)', 'title_gu', row?.title_gu ?? '')}
${field('Description (English)', 'desc_en', row?.desc_en ?? '', { type: 'textarea' })}
${field('Description (Gujarati)', 'desc_gu', row?.desc_gu ?? '', { type: 'textarea' })}
${field('Image URL (optional)', 'image_url', row?.image_url ?? '', { placeholder: 'https://…' })}
${actions(id ? 'Update event' : 'Create event')}
</form>
${id ? `<form method="post" action="/vedmata/page-text/timeline/${escapeHtml(id)}/delete" onsubmit="return confirm('Delete this timeline event?')">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit timeline event' : 'New timeline event',
		activePath: '/vedmata/page-text',
		content,
	});
}

async function saveTimeline(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const year = Number(form.get('year'));
	const sortOrder = Number(form.get('sort_order'));
	const titleEn = String(form.get('title_en') ?? '').trim();
	const titleGu = String(form.get('title_gu') ?? '').trim() || null;
	const descEn = String(form.get('desc_en') ?? '').trim() || null;
	const descGu = String(form.get('desc_gu') ?? '').trim() || null;
	const imageUrl = String(form.get('image_url') ?? '').trim() || null;

	if (!titleEn || !Number.isFinite(year) || !Number.isFinite(sortOrder)) {
		return timelineForm(request, env, session, id);
	}

	const eventId = id ?? randomId('tle');
	if (id) {
		await env.DB.prepare(
			'UPDATE timeline_events SET year=?, title_en=?, title_gu=?, desc_en=?, desc_gu=?, image_url=?, sort_order=? WHERE id=?',
		)
			.bind(year, titleEn, titleGu, descEn, descGu, imageUrl, sortOrder, id)
			.run();
	} else {
		await env.DB.prepare(
			'INSERT INTO timeline_events (id, year, title_en, title_gu, desc_en, desc_gu, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		)
			.bind(eventId, year, titleEn, titleGu, descEn, descGu, imageUrl, sortOrder)
			.run();
	}

	return adminRedirect('/vedmata/page-text/timeline');
}

async function removeTimeline(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}
	await env.DB.prepare('DELETE FROM timeline_events WHERE id = ?').bind(id).run();
	return adminRedirect('/vedmata/page-text/timeline');
}
