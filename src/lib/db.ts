import type { UserRole } from './types';

export type UserRow = {
	id: string;
	email: string;
	role: UserRole;
	created_at: string;
};

export const SUPERADMIN_EMAIL = 'hello@axiso.com.au';

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
	const normalized = email.trim().toLowerCase();
	const row = await db
		.prepare('SELECT id, email, role, created_at FROM users WHERE email = ? COLLATE NOCASE')
		.bind(normalized)
		.first<UserRow>();
	return row ?? null;
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
	const row = await db
		.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?')
		.bind(id)
		.first<UserRow>();
	return row ?? null;
}

export async function insertOtpCode(
	db: D1Database,
	id: string,
	userId: string,
	codeHash: string,
	expiresAt: string,
): Promise<void> {
	await db
		.prepare('INSERT INTO otp_codes (id, user_id, code_hash, expires_at) VALUES (?, ?, ?, ?)')
		.bind(id, userId, codeHash, expiresAt)
		.run();
}

export async function findValidOtpCode(
	db: D1Database,
	userId: string,
	codeHash: string,
	nowIso: string,
): Promise<{ id: string } | null> {
	const row = await db
		.prepare(
			`SELECT id FROM otp_codes
			 WHERE user_id = ? AND code_hash = ? AND used_at IS NULL AND expires_at > ?
			 ORDER BY expires_at DESC LIMIT 1`,
		)
		.bind(userId, codeHash, nowIso)
		.first<{ id: string }>();
	return row ?? null;
}

export async function markOtpUsed(db: D1Database, id: string, usedAt: string): Promise<void> {
	await db.prepare('UPDATE otp_codes SET used_at = ? WHERE id = ?').bind(usedAt, id).run();
}

export async function insertSession(
	db: D1Database,
	id: string,
	userId: string,
	tokenHash: string,
	expiresAt: string,
): Promise<void> {
	await db
		.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)')
		.bind(id, userId, tokenHash, expiresAt)
		.run();
}

export async function findSessionByTokenHash(
	db: D1Database,
	tokenHash: string,
	nowIso: string,
): Promise<{ id: string; user_id: string } | null> {
	const row = await db
		.prepare('SELECT id, user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
		.bind(tokenHash, nowIso)
		.first<{ id: string; user_id: string }>();
	return row ?? null;
}

export async function deleteSession(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export async function deleteSessionByTokenHash(db: D1Database, tokenHash: string): Promise<void> {
	await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}
