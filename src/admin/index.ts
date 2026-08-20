import { getAuthSession } from '../lib/auth';
import {
	handleLoginGet,
	handleLoginIdentify,
	handleLogout,
	handleOtpRequest,
	handleOtpVerify,
	handleSuperadminLogin,
} from './auth-handlers';
import { handleEventsRoutes } from './handlers/events';
import { handleGalleryRoutes } from './handlers/gallery';
import { handlePageTextRoutes } from './handlers/page-text';
import { handleScheduleRoutes } from './handlers/schedule';
import { handleStallRoutes } from './handlers/stall';
import { handleSubmissionsRoutes } from './handlers/submissions';
import { renderAdminHome, renderAdminSection } from './pages';
import { canAccessSection, navItemsForRole, sectionFromPath } from './rbac';
import { adminHtmlResponse } from './security';
import { createSignedCsrfToken, renderAdminLayout, renderForbiddenPage, renderNavLinks } from './templates';

type ContentHandler = (
	request: Request,
	env: Env,
	session: Awaited<ReturnType<typeof getAuthSession>> & object,
	pathname: string,
) => Promise<Response | null>;

const CONTENT_HANDLERS: ContentHandler[] = [
	handleEventsRoutes,
	handleScheduleRoutes,
	handleGalleryRoutes,
	handleStallRoutes,
	handlePageTextRoutes,
	handleSubmissionsRoutes,
];

async function renderForbidden(request: Request, env: Env, session: NonNullable<Awaited<ReturnType<typeof getAuthSession>>>, pathname: string): Promise<Response> {
	const csrfToken = await createSignedCsrfToken(env);
	const nav = navItemsForRole(session.role);
	const html = renderAdminLayout({
		title: 'Access denied',
		activePath: pathname,
		email: session.email,
		role: session.role,
		navHtml: renderNavLinks(nav, pathname),
		content: renderForbiddenPage(),
		csrfToken,
	});
	return adminHtmlResponse(html, { status: 403 });
}

export async function handleAdmin(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	const { pathname } = url;

	if (pathname === '/vedmata/login' && request.method === 'GET') {
		return handleLoginGet(request, env);
	}

	if (pathname === '/vedmata/login/identify' && request.method === 'POST') {
		return handleLoginIdentify(request, env);
	}

	if (pathname === '/vedmata/auth/otp/request' && request.method === 'POST') {
		return handleOtpRequest(request, env);
	}

	if (pathname === '/vedmata/auth/otp/verify' && request.method === 'POST') {
		return handleOtpVerify(request, env);
	}

	if (pathname === '/vedmata/auth/superadmin' && request.method === 'POST') {
		return handleSuperadminLogin(request, env);
	}

	if (pathname === '/vedmata/logout' && request.method === 'POST') {
		return handleLogout(request, env);
	}

	const session = await getAuthSession(request, env);
	if (!session) {
		return adminHtmlResponse('', { status: 302, headers: { Location: '/vedmata/login' } });
	}

	if (pathname === '/vedmata' || pathname === '/vedmata/') {
		if (request.method !== 'GET') {
			return adminHtmlResponse('Method Not Allowed', { status: 405 });
		}
		return renderAdminHome(env, session);
	}

	const section = sectionFromPath(pathname);
	if (section && !canAccessSection(session.role, section)) {
		return renderForbidden(request, env, session, pathname);
	}

	for (const handler of CONTENT_HANDLERS) {
		const response = await handler(request, env, session, pathname);
		if (response) {
			return response;
		}
	}

	if (request.method !== 'GET') {
		return adminHtmlResponse('Method Not Allowed', { status: 405 });
	}

	return renderAdminSection(request, env, session, pathname);
}
