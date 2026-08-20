import { getAuthSession } from '../lib/auth';
import {
	handleLoginGet,
	handleLoginIdentify,
	handleLogout,
	handleOtpRequest,
	handleOtpVerify,
	handleSuperadminLogin,
} from './auth-handlers';
import { renderAdminHome, renderAdminSection } from './pages';
import { adminHtmlResponse } from './security';

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

	if (request.method !== 'GET') {
		return adminHtmlResponse('Method Not Allowed', { status: 405 });
	}

	return renderAdminSection(request, env, session, pathname);
}
