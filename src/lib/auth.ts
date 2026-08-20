import {
	deleteSessionByTokenHash,
	findSessionByTokenHash,
	findUserById,
	insertOtpCode,
	insertSession,
	markOtpUsed,
	findValidOtpCode,
	SUPERADMIN_EMAIL,
} from './db';
import {
	deriveSessionSigningKey,
	generateOtpCode,
	hmacSha256Base64Url,
	randomId,
	randomToken,
	sha256Hex,
	timingSafeEqualString,
} from './crypto';

import type { UserRole } from './types';

export const SESSION_COOKIE = 'vedmata_session';
const SESSION_DAYS = 7;
const OTP_MINUTES = 10;

export type AuthSession = {
	sessionId: string;
	userId: string;
	email: string;
	role: UserRole;
};

export function isStaffRole(role: string): role is UserRole {
	return role === 'superadmin' || role === 'admin' || role === 'manager';
}

export function isOtpRole(role: UserRole): boolean {
	return role === 'admin' || role === 'manager';
}

export function isSuperadminEmail(email: string): boolean {
	return email.trim().toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
}

export async function verifySuperadminPassword(password: string, secret: string): Promise<boolean> {
	return timingSafeEqualString(password, secret);
}

export async function issueOtp(db: D1Database, userId: string): Promise<{ code: string; expiresAt: string }> {
	const code = generateOtpCode();
	const codeHash = await sha256Hex(code);
	const expiresAt = new Date(Date.now() + OTP_MINUTES * 60_000).toISOString();
	await insertOtpCode(db, randomId('otp'), userId, codeHash, expiresAt);
	return { code, expiresAt };
}

export async function verifyOtp(
	db: D1Database,
	userId: string,
	code: string,
): Promise<boolean> {
	const codeHash = await sha256Hex(code.trim());
	const now = new Date().toISOString();
	const row = await findValidOtpCode(db, userId, codeHash, now);
	if (!row) {
		return false;
	}
	await markOtpUsed(db, row.id, now);
	return true;
}

export async function createSession(db: D1Database, userId: string, signingKey: string): Promise<string> {
	const sessionId = randomId('ses');
	const token = randomToken();
	const tokenHash = await sha256Hex(token);
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000).toISOString();
	await insertSession(db, sessionId, userId, tokenHash, expiresAt);
	const signature = await hmacSha256Base64Url(`${sessionId}|${token}`, signingKey);
	return `v1.${sessionId}.${token}.${signature}`;
}

export async function parseSessionCookie(
	cookieValue: string,
	db: D1Database,
	signingKey: string,
): Promise<AuthSession | null> {
	const parts = cookieValue.split('.');
	if (parts.length !== 4 || parts[0] !== 'v1') {
		return null;
	}
	const [, sessionId, token, signature] = parts;
	if (!sessionId || !token || !signature) {
		return null;
	}

	const expected = await hmacSha256Base64Url(`${sessionId}|${token}`, signingKey);
	if (!timingSafeEqualString(signature, expected)) {
		return null;
	}

	const tokenHash = await sha256Hex(token);
	const now = new Date().toISOString();
	const session = await findSessionByTokenHash(db, tokenHash, now);
	if (!session || session.id !== sessionId) {
		return null;
	}

	const user = await findUserById(db, session.user_id);
	if (!user || !isStaffRole(user.role)) {
		return null;
	}

	return {
		sessionId: session.id,
		userId: user.id,
		email: user.email,
		role: user.role,
	};
}

export function readSessionCookie(request: Request): string | null {
	const header = request.headers.get('Cookie');
	if (!header) {
		return null;
	}
	for (const part of header.split(';')) {
		const [name, ...rest] = part.trim().split('=');
		if (name === SESSION_COOKIE) {
			return decodeURIComponent(rest.join('='));
		}
	}
	return null;
}

export async function getAuthSession(request: Request, env: Env): Promise<AuthSession | null> {
	const cookie = readSessionCookie(request);
	if (!cookie) {
		return null;
	}
	const signingKey = await deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
	return parseSessionCookie(cookie, env.DB, signingKey);
}

export function sessionCookieHeader(value: string, secure: boolean): string {
	const flags = `Path=/vedmata; HttpOnly; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; SameSite=Strict${secure ? '; Secure' : ''}`;
	return `${SESSION_COOKIE}=${encodeURIComponent(value)}; ${flags}`;
}

export function clearSessionCookie(secure: boolean): string {
	const flags = `Path=/vedmata; HttpOnly; Max-Age=0; SameSite=Strict${secure ? '; Secure' : ''}`;
	return `${SESSION_COOKIE}=; ${flags}`;
}

export async function destroySession(request: Request, env: Env): Promise<void> {
	const cookie = readSessionCookie(request);
	if (!cookie) {
		return;
	}
	const signingKey = await deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
	const parts = cookie.split('.');
	if (parts.length === 4 && parts[2]) {
		const tokenHash = await sha256Hex(parts[2]);
		await deleteSessionByTokenHash(env.DB, tokenHash);
	}
}

export function isSecureRequest(request: Request): boolean {
	const url = new URL(request.url);
	return url.protocol === 'https:';
}
