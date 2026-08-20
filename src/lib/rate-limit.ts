export type RateLimitScope = 'otp_request' | 'otp_verify' | 'password_login' | 'form_submit';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export type RateLimitResult =
	| { allowed: true }
	| { allowed: false; retryAfterSeconds: number; reason: 'locked' | 'too_many' };

export async function checkRateLimit(
	db: D1Database,
	scope: RateLimitScope,
	identifier: string,
): Promise<RateLimitResult> {
	const now = Date.now();
	const windowStart = new Date(now - WINDOW_MINUTES * 60_000).toISOString();

	const recent = await db
		.prepare(
			`SELECT COUNT(*) AS count FROM auth_attempts
			 WHERE scope = ? AND identifier = ? AND created_at > ?`,
		)
		.bind(scope, identifier, windowStart)
		.first<{ count: number }>();

	const count = recent?.count ?? 0;
	if (count < MAX_ATTEMPTS) {
		return { allowed: true };
	}

	const oldestInWindow = await db
		.prepare(
			`SELECT created_at FROM auth_attempts
			 WHERE scope = ? AND identifier = ? AND created_at > ?
			 ORDER BY created_at ASC LIMIT 1`,
		)
		.bind(scope, identifier, windowStart)
		.first<{ created_at: string }>();

	const oldestMs = oldestInWindow ? Date.parse(oldestInWindow.created_at) : now;
	const retryAfterMs = Math.max(LOCKOUT_MINUTES * 60_000 - (now - oldestMs), 60_000);

	return {
		allowed: false,
		retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
		reason: count >= MAX_ATTEMPTS ? 'locked' : 'too_many',
	};
}

export async function recordRateLimitAttempt(
	db: D1Database,
	scope: RateLimitScope,
	identifier: string,
): Promise<void> {
	const id = `att_${crypto.randomUUID()}`;
	await db
		.prepare('INSERT INTO auth_attempts (id, scope, identifier) VALUES (?, ?, ?)')
		.bind(id, scope, identifier)
		.run();
}

export function clientIdentifier(request: Request): string {
	return (
		request.headers.get('CF-Connecting-IP') ??
		request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
		'unknown'
	);
}

export async function enforceRateLimit(
	db: D1Database,
	scope: RateLimitScope,
	email: string,
	request: Request,
): Promise<RateLimitResult> {
	const normalizedEmail = email.trim().toLowerCase();
	const ip = clientIdentifier(request);

	const emailCheck = await checkRateLimit(db, scope, normalizedEmail);
	if (!emailCheck.allowed) {
		return emailCheck;
	}

	const ipCheck = await checkRateLimit(db, scope, `ip:${ip}`);
	if (!ipCheck.allowed) {
		return ipCheck;
	}

	return { allowed: true };
}

export async function recordAuthAttempt(
	db: D1Database,
	scope: RateLimitScope,
	email: string,
	request: Request,
): Promise<void> {
	const normalizedEmail = email.trim().toLowerCase();
	const ip = clientIdentifier(request);
	await recordRateLimitAttempt(db, scope, normalizedEmail);
	await recordRateLimitAttempt(db, scope, `ip:${ip}`);
}
