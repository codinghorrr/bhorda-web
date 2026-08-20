import { hmacSha256Base64Url, randomToken, timingSafeEqualString } from './crypto';

export const CSRF_COOKIE = 'vedmata_csrf';
const CSRF_MAX_AGE = 60 * 60; // 1 hour

export function createCsrfToken(): string {
	return randomToken(24);
}

export async function signCsrfToken(token: string, signingKey: string): Promise<string> {
	const signature = await hmacSha256Base64Url(token, signingKey);
	return `${token}.${signature}`;
}

export async function verifyCsrfToken(signed: string, signingKey: string): Promise<boolean> {
	const separator = signed.lastIndexOf('.');
	if (separator <= 0) {
		return false;
	}
	const token = signed.slice(0, separator);
	const signature = signed.slice(separator + 1);
	const expected = await hmacSha256Base64Url(token, signingKey);
	return timingSafeEqualString(signature, expected);
}

export function readCsrfCookie(request: Request): string | null {
	const header = request.headers.get('Cookie');
	if (!header) {
		return null;
	}
	for (const part of header.split(';')) {
		const [name, ...rest] = part.trim().split('=');
		if (name === CSRF_COOKIE) {
			return decodeURIComponent(rest.join('='));
		}
	}
	return null;
}

export function csrfCookieHeader(signedToken: string, secure: boolean): string {
	const flags = `Path=/vedmata; Max-Age=${CSRF_MAX_AGE}; SameSite=Strict${secure ? '; Secure' : ''}`;
	return `${CSRF_COOKIE}=${encodeURIComponent(signedToken)}; ${flags}`;
}

export async function validateCsrf(request: Request, formToken: string | null, signingKey: string): Promise<boolean> {
	if (!formToken) {
		return false;
	}
	const cookieToken = readCsrfCookie(request);
	if (!cookieToken) {
		return false;
	}
	const [cookieValid, formValid] = await Promise.all([
		verifyCsrfToken(cookieToken, signingKey),
		verifyCsrfToken(formToken, signingKey),
	]);
	if (!cookieValid || !formValid) {
		return false;
	}
	const cookieValue = cookieToken.slice(0, cookieToken.lastIndexOf('.'));
	const formValue = formToken.slice(0, formToken.lastIndexOf('.'));
	return timingSafeEqualString(cookieValue, formValue);
}
