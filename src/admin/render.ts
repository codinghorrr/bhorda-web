import type { AuthSession } from '../lib/auth';
import { csrfCookieHeader } from '../lib/csrf';
import { isSecureRequest } from '../lib/auth';
import { navItemsForRole } from './rbac';
import { adminHtmlResponse } from './security';
import { createSignedCsrfToken, renderAdminLayout, renderNavLinks } from './templates';

export type AdminPageOptions = {
	session: AuthSession;
	title: string;
	activePath: string;
	content: string;
	status?: number;
};

export async function renderAdminPage(request: Request, env: Env, options: AdminPageOptions): Promise<Response> {
	const csrfToken = await createSignedCsrfToken(env);
	const nav = navItemsForRole(options.session.role);
	const html = renderAdminLayout({
		title: options.title,
		activePath: options.activePath,
		email: options.session.email,
		role: options.session.role,
		navHtml: renderNavLinks(nav, options.activePath),
		content: options.content,
		csrfToken,
	});
	const secure = isSecureRequest(request);
	return adminHtmlResponse(html, {
		status: options.status ?? 200,
		cookies: [csrfCookieHeader(csrfToken, secure)],
	});
}

export function adminRedirect(path: string, status = 303): Response {
	return adminHtmlResponse('', { status, headers: { Location: path } });
}
