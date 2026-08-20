import {
	createSession,
	destroySession,
	getAuthSession,
	isOtpRole,
	isSecureRequest,
	isSuperadminEmail,
	issueOtp,
	sessionCookieHeader,
	clearSessionCookie,
	verifyOtp,
	verifySuperadminPassword,
} from '../lib/auth';
import { validateCsrf, csrfCookieHeader } from '../lib/csrf';
import { deriveSessionSigningKey } from '../lib/crypto';
import { findUserByEmail } from '../lib/db';
import { sendOtpEmail } from '../lib/email';
import { enforceRateLimit, recordAuthAttempt } from '../lib/rate-limit';
import { adminHtmlResponse } from './security';
import { createSignedCsrfToken, renderLoginPage, type LoginViewOptions } from './templates';

const GENERIC_AUTH_MESSAGE =
	'If an account exists for that email, you will receive sign-in instructions shortly.';

async function signingKey(env: Env): Promise<string> {
	return deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
}

function withCsrfCookie(html: string, request: Request, signedToken: string, init?: ResponseInit): Response {
	const secure = isSecureRequest(request);
	return adminHtmlResponse(html, {
		...init,
		cookies: [csrfCookieHeader(signedToken, secure)],
	});
}

async function renderLoginResponse(
	env: Env,
	request: Request,
	options: Omit<LoginViewOptions, 'csrfToken'>,
	init?: ResponseInit,
): Promise<Response> {
	const csrfToken = await createSignedCsrfToken(env);
	const html = renderLoginPage({ ...options, csrfToken });
	return withCsrfCookie(html, request, csrfToken, init);
}

async function validateAdminCsrf(request: Request, env: Env, form: FormData): Promise<boolean> {
	const key = await signingKey(env);
	return validateCsrf(request, String(form.get('csrf_token') ?? ''), key);
}

async function establishSession(request: Request, env: Env, userId: string): Promise<Response> {
	const cookieValue = await createSession(env.DB, userId, await signingKey(env));
	const secure = isSecureRequest(request);
	return adminHtmlResponse('', {
		status: 302,
		headers: { Location: '/vedmata' },
		cookies: [sessionCookieHeader(cookieValue, secure)],
	});
}

export async function handleLoginGet(request: Request, env: Env): Promise<Response> {
	const session = await getAuthSession(request, env);
	if (session) {
		return adminHtmlResponse('', { status: 302, headers: { Location: '/vedmata' } });
	}
	return renderLoginResponse(env, request, { step: 'email' });
}

export async function handleLoginIdentify(request: Request, env: Env): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminCsrf(request, env, form))) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid session. Please try again.' }, { status: 403 });
	}

	const email = String(form.get('email') ?? '').trim().toLowerCase();
	if (!email) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Email is required.' }, { status: 400 });
	}

	const user = await findUserByEmail(env.DB, email);

	if (user && user.role === 'superadmin') {
		return renderLoginResponse(env, request, { step: 'password', email });
	}

	if (user && isOtpRole(user.role)) {
		const limit = await enforceRateLimit(env.DB, 'otp_request', email, request);
		if (!limit.allowed) {
			return renderLoginResponse(
				env,
				request,
				{ step: 'email', error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
				{ status: 429 },
			);
		}

		const { code } = await issueOtp(env.DB, user.id);
		await sendOtpEmail(env, user.email, code);
		await recordAuthAttempt(env.DB, 'otp_request', email, request);

		return renderLoginResponse(env, request, {
			step: 'otp',
			email,
			message: 'Enter the 6-digit code sent to your email.',
		});
	}

	return renderLoginResponse(env, request, { step: 'email', message: GENERIC_AUTH_MESSAGE });
}

export async function handleOtpRequest(request: Request, env: Env): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminCsrf(request, env, form))) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid session. Please try again.' }, { status: 403 });
	}

	const email = String(form.get('email') ?? '').trim().toLowerCase();
	const user = await findUserByEmail(env.DB, email);

	if (!user || !isOtpRole(user.role)) {
		return renderLoginResponse(env, request, { step: 'email', message: GENERIC_AUTH_MESSAGE });
	}

	const limit = await enforceRateLimit(env.DB, 'otp_request', email, request);
	if (!limit.allowed) {
		return renderLoginResponse(
			env,
			request,
			{ step: 'otp', email, error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
			{ status: 429 },
		);
	}

	const { code } = await issueOtp(env.DB, user.id);
	await sendOtpEmail(env, user.email, code);
	await recordAuthAttempt(env.DB, 'otp_request', email, request);

	return renderLoginResponse(env, request, { step: 'otp', email, message: 'A new code has been sent.' });
}

export async function handleOtpVerify(request: Request, env: Env): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminCsrf(request, env, form))) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid session. Please try again.' }, { status: 403 });
	}

	const email = String(form.get('email') ?? '').trim().toLowerCase();
	const code = String(form.get('code') ?? '').trim();
	const user = await findUserByEmail(env.DB, email);

	if (!user || !isOtpRole(user.role)) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid code or email.' }, { status: 401 });
	}

	const limit = await enforceRateLimit(env.DB, 'otp_verify', email, request);
	if (!limit.allowed) {
		return renderLoginResponse(
			env,
			request,
			{ step: 'otp', email, error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
			{ status: 429 },
		);
	}

	await recordAuthAttempt(env.DB, 'otp_verify', email, request);

	const valid = await verifyOtp(env.DB, user.id, code);
	if (!valid) {
		return renderLoginResponse(env, request, { step: 'otp', email, error: 'Invalid or expired code.' }, { status: 401 });
	}

	return establishSession(request, env, user.id);
}

export async function handleSuperadminLogin(request: Request, env: Env): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminCsrf(request, env, form))) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid session. Please try again.' }, { status: 403 });
	}

	const email = String(form.get('email') ?? '').trim().toLowerCase();
	const password = String(form.get('password') ?? '');

	if (!isSuperadminEmail(email)) {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid credentials.' }, { status: 401 });
	}

	const user = await findUserByEmail(env.DB, email);
	if (!user || user.role !== 'superadmin') {
		return renderLoginResponse(env, request, { step: 'email', error: 'Invalid credentials.' }, { status: 401 });
	}

	const limit = await enforceRateLimit(env.DB, 'password_login', email, request);
	if (!limit.allowed) {
		return renderLoginResponse(
			env,
			request,
			{ step: 'password', email, error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` },
			{ status: 429 },
		);
	}

	await recordAuthAttempt(env.DB, 'password_login', email, request);

	const valid = await verifySuperadminPassword(password, env.SUPERADMIN_PASSWORD);
	if (!valid) {
		return renderLoginResponse(env, request, { step: 'password', email, error: 'Invalid credentials.' }, { status: 401 });
	}

	return establishSession(request, env, user.id);
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminCsrf(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	await destroySession(request, env);
	const secure = isSecureRequest(request);
	return adminHtmlResponse('', {
		status: 302,
		headers: { Location: '/vedmata/login' },
		cookies: [clearSessionCookie(secure)],
	});
}
