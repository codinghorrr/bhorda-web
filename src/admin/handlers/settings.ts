import type { AuthSession } from '../../lib/auth';
import { loadAnalyticsSettings, saveSiteSetting } from '../../lib/analytics';
import { escapeHtml } from '../../lib/html';
import { actions, alert, checkbox, field, hidden } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

export async function handleSettingsRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/settings')) {
		return null;
	}

	if (session.role !== 'superadmin') {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	if (pathname === '/vedmata/settings' && request.method === 'GET') {
		return settingsForm(request, env, session);
	}
	if (pathname === '/vedmata/settings' && request.method === 'POST') {
		return saveSettings(request, env, session);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function settingsForm(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const csrf = await getCsrfToken(env);
	const settings = await loadAnalyticsSettings(env.DB);

	const content = `${alert('Analytics snippets are injected site-wide in the public page head. Only enable trusted code.', 'info')}
<form class="admin-form admin-form--wide" method="post" action="/vedmata/settings">
${hidden('csrf_token', csrf)}
${checkbox('Enable GA4 snippet below', 'ga4_enabled', settings.ga4Enabled)}
${field('GA4 snippet (HTML/JS)', 'ga4_snippet', settings.ga4Snippet, { type: 'textarea', rows: 6, placeholder: '<!-- Google tag (gtag.js) -->...' })}
${checkbox('Enable Cloudflare Web Analytics beacon', 'cf_web_analytics_enabled', settings.cfWebAnalyticsEnabled)}
${field('Cloudflare Web Analytics token', 'cf_web_analytics_token', settings.cfWebAnalyticsToken, { placeholder: 'CF beacon token' })}
${field('Additional head scripts (HTML)', 'head_scripts', settings.headScripts, { type: 'textarea', rows: 4 })}
<p class="admin-form-hint">GA4 measurement ID from env (GA4_ID): <code>${escapeHtml(env.GA4_ID || '(not set)')}</code> — paste the full snippet above when enabling GA4.</p>
${actions('Save settings')}
</form>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Site Settings',
		activePath: '/vedmata/settings',
		content,
	});
}

async function saveSettings(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	await saveSiteSetting(env.DB, 'ga4_enabled', form.get('ga4_enabled') === '1' ? '1' : '0');
	await saveSiteSetting(env.DB, 'ga4_snippet', String(form.get('ga4_snippet') ?? ''));
	await saveSiteSetting(env.DB, 'cf_web_analytics_enabled', form.get('cf_web_analytics_enabled') === '1' ? '1' : '0');
	await saveSiteSetting(env.DB, 'cf_web_analytics_token', String(form.get('cf_web_analytics_token') ?? '').trim());
	await saveSiteSetting(env.DB, 'head_scripts', String(form.get('head_scripts') ?? ''));

	return adminRedirect('/vedmata/settings');
}
