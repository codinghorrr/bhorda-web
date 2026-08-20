import type { AuthSession } from '../../lib/auth';
import { loadAnalyticsSummary } from '../../lib/analytics';
import { escapeHtml } from '../../lib/html';
import { renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

function renderTable(rows: { label: string; value: string | number }[], empty: string): string {
	if (rows.length === 0) {
		return `<p class="admin-form-hint">${escapeHtml(empty)}</p>`;
	}
	const items = rows
		.map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(String(r.value))}</td></tr>`)
		.join('');
	return `<table class="admin-table"><tbody>${items}</tbody></table>`;
}

export async function handleAnalyticsRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/analytics')) {
		return null;
	}

	if (pathname === '/vedmata/analytics' && request.method === 'GET') {
		return dashboard(request, env, session);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function dashboard(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const summary = await loadAnalyticsSummary(env.DB);

	const topPages = renderTable(
		summary.topPages.map((r) => ({ label: r.path, value: r.views })),
		'No page views recorded yet.',
	);
	const topEvents = renderTable(
		summary.topEvents.map((r) => ({ label: r.path, value: r.views })),
		'No event page views yet.',
	);
	const topGallery = renderTable(
		summary.topGallery.map((r) => ({ label: r.path, value: r.views })),
		'No gallery page views yet.',
	);
	const submissions = renderTable(
		summary.submissionsByDay.map((r) => ({ label: r.day, value: r.count })),
		'No submissions in the last 7 days.',
	);

	const sources = summary.enabledSources.map((s) => `<li>${escapeHtml(s)}</li>`).join('');

	const content = `<p class="admin-placeholder-lead">Read-only summary for the last 7 days. On-site metrics are recorded automatically; enable GA4 or Cloudflare Web Analytics in Site Settings for external reporting.</p>
<ul>${sources}</ul>
<div class="admin-stat-row">
	<div class="stat-card"><span class="stat-card__value">${summary.visitors7d}</span><span class="stat-card__label">Unique visitors (7d)</span></div>
	<div class="stat-card"><span class="stat-card__value">${summary.pageViews7d}</span><span class="stat-card__label">Page views (7d)</span></div>
</div>
<h2 class="admin-subheading">Top pages</h2>
${topPages}
<h2 class="admin-subheading">Top event pages</h2>
${topEvents}
<h2 class="admin-subheading">Top gallery pages</h2>
${topGallery}
<h2 class="admin-subheading">Submission volume by day</h2>
${submissions}`;

	return renderAdminPage(request, env, {
		session,
		title: 'Analytics Dashboard',
		activePath: '/vedmata/analytics',
		content,
	});
}
