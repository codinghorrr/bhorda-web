import type { AuthSession } from '../../lib/auth';
import { escapeHtml } from '../../lib/html';
import { hidden } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse, applyAdminSecurityHeaders } from '../security';

type SubmissionRow = {
	id: string;
	form_type: string;
	payload_json: string;
	submitted_at: string;
	handled: number;
	handled_by: string | null;
	handled_at: string | null;
};

function parsePayload(json: string): Record<string, unknown> {
	try {
		const parsed: unknown = JSON.parse(json);
		if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
		}
	} catch {
		/* invalid JSON */
	}
	return {};
}

function payloadName(payload: Record<string, unknown>): string {
	const name = payload.name ?? payload.full_name;
	return typeof name === 'string' ? name.trim() : '';
}

function payloadContact(payload: Record<string, unknown>): string {
	const parts: string[] = [];
	for (const key of ['email', 'phone']) {
		const value = payload[key];
		if (typeof value === 'string' && value.trim()) {
			parts.push(value.trim());
		}
	}
	return parts.join(' · ');
}

function payloadSummary(payloadJson: string): string {
	const trimmed = payloadJson.trim();
	if (trimmed.length <= 80) {
		return trimmed;
	}
	return `${trimmed.slice(0, 80)}…`;
}

function csvCell(value: string): string {
	return `"${value.replace(/"/g, '""')}"`;
}

function csvResponse(body: string): Response {
	return applyAdminSecurityHeaders(
		new Response(body, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': 'attachment; filename="submissions.csv"',
			},
		}),
	);
}

export async function handleSubmissionsRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/submissions')) {
		return null;
	}

	if (pathname === '/vedmata/submissions/export.csv' && request.method === 'GET') {
		const formTypeFilter = new URL(request.url).searchParams.get('form_type')?.trim() || undefined;
		return exportCsv(env, formTypeFilter);
	}

	const toggleMatch = /^\/vedmata\/submissions\/([^/]+)\/toggle-handled$/.exec(pathname);
	if (toggleMatch && request.method === 'POST') {
		return toggleHandled(request, env, session, toggleMatch[1]!);
	}

	if (pathname === '/vedmata/submissions' && request.method === 'GET') {
		return list(request, env, session);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function list(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const url = new URL(request.url);
	const formTypeFilter = url.searchParams.get('form_type')?.trim() ?? '';

	const typesResult = await env.DB.prepare('SELECT DISTINCT form_type FROM submissions ORDER BY form_type').all<{
		form_type: string;
	}>();
	const formTypes = typesResult.results?.map((r) => r.form_type) ?? [];

	const query = formTypeFilter
		? 'SELECT * FROM submissions WHERE form_type = ? ORDER BY submitted_at DESC'
		: 'SELECT * FROM submissions ORDER BY submitted_at DESC';
	const stmt = formTypeFilter ? env.DB.prepare(query).bind(formTypeFilter) : env.DB.prepare(query);
	const rows = await stmt.all<SubmissionRow>();

	const csrf = await getCsrfToken(env);
	const filterOptions = [
		`<option value="">All types</option>`,
		...formTypes.map(
			(t) =>
				`<option value="${escapeHtml(t)}"${t === formTypeFilter ? ' selected' : ''}>${escapeHtml(t)}</option>`,
		),
	].join('');

	const items =
		rows.results
			?.map((row) => {
				const payload = parsePayload(row.payload_json);
				const name = payloadName(payload) || '—';
				const contact = payloadContact(payload) || '—';
				const summary = escapeHtml(payloadSummary(row.payload_json));
				const handled = row.handled === 1;
				const rowClass = handled ? ' class="admin-row--handled"' : '';
				const toggleLabel = handled ? 'Handled' : 'Mark handled';
				const filterHidden = formTypeFilter ? hidden('form_type', formTypeFilter) : '';

				return `<tr${rowClass}>
			<td>${escapeHtml(row.form_type)}</td>
			<td>${escapeHtml(name)}</td>
			<td>${escapeHtml(contact)}</td>
			<td class="admin-cell--summary" title="${escapeHtml(row.payload_json)}">${summary}</td>
			<td>${escapeHtml(row.submitted_at)}</td>
			<td>
				<form method="post" action="/vedmata/submissions/${escapeHtml(row.id)}/toggle-handled">
					${hidden('csrf_token', csrf)}
					${filterHidden}
					<button class="btn btn--ghost${handled ? ' admin-toggle--on' : ''}" type="submit">${escapeHtml(toggleLabel)}</button>
				</form>
			</td>
		</tr>`;
			})
			.join('') ?? '';

	const exportHref = formTypeFilter
		? `/vedmata/submissions/export.csv?form_type=${encodeURIComponent(formTypeFilter)}`
		: '/vedmata/submissions/export.csv';

	const content = `<div class="admin-toolbar">
	<form class="admin-filter" method="get" action="/vedmata/submissions">
		<label class="admin-label" for="form_type">Form type</label>
		<select class="admin-input" id="form_type" name="form_type" onchange="this.form.submit()">${filterOptions}</select>
	</form>
	<a class="btn btn--gold" href="${escapeHtml(exportHref)}">Export CSV</a>
</div>
<table class="admin-table"><thead><tr>
	<th>Type</th><th>Name</th><th>Contact</th><th>Summary</th><th>Submitted</th><th>Handled</th>
</tr></thead>
<tbody>${items || '<tr><td colspan="6">No submissions yet.</td></tr>'}</tbody></table>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Submissions Inbox',
		activePath: '/vedmata/submissions',
		content,
	});
}

async function toggleHandled(
	request: Request,
	env: Env,
	session: AuthSession,
	id: string,
): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const row = await env.DB.prepare('SELECT handled FROM submissions WHERE id = ?').bind(id).first<{ handled: number }>();
	if (!row) {
		return adminHtmlResponse('Not Found', { status: 404 });
	}

	const now = new Date().toISOString();
	if (row.handled === 1) {
		await env.DB.prepare('UPDATE submissions SET handled = 0, handled_by = NULL, handled_at = NULL WHERE id = ?')
			.bind(id)
			.run();
	} else {
		await env.DB.prepare(
			'UPDATE submissions SET handled = 1, handled_by = ?, handled_at = ? WHERE id = ?',
		)
			.bind(session.userId, now, id)
			.run();
	}

	const formType = String(form.get('form_type') ?? '').trim();
	const returnQuery = formType ? `?form_type=${encodeURIComponent(formType)}` : '';
	return adminRedirect(`/vedmata/submissions${returnQuery}`);
}

async function exportCsv(env: Env, formTypeFilter?: string): Promise<Response> {
	const query = formTypeFilter
		? 'SELECT form_type, submitted_at, handled, payload_json FROM submissions WHERE form_type = ? ORDER BY submitted_at DESC'
		: 'SELECT form_type, submitted_at, handled, payload_json FROM submissions ORDER BY submitted_at DESC';
	const stmt = formTypeFilter ? env.DB.prepare(query).bind(formTypeFilter) : env.DB.prepare(query);
	const rows = await stmt.all<Pick<SubmissionRow, 'form_type' | 'submitted_at' | 'handled' | 'payload_json'>>();

	const lines = ['form_type,submitted_at,handled,payload_json'];
	for (const row of rows.results ?? []) {
		lines.push(
			[
				csvCell(row.form_type),
				csvCell(row.submitted_at),
				csvCell(row.handled === 1 ? '1' : '0'),
				csvCell(row.payload_json),
			].join(','),
		);
	}

	return csvResponse(`${lines.join('\n')}\n`);
}
