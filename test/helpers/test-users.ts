/** Inserts the RBAC test manager used by integration tests (not present after migration 0007). */
export async function ensureTestManagerUser(db: D1Database): Promise<void> {
	await db
		.prepare('INSERT OR IGNORE INTO users (id, email, role) VALUES (?, ?, ?)')
		.bind('usr_test_manager', 'manager.test@sevatirthbhorda.org', 'manager')
		.run();
}
