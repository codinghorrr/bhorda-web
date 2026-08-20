-- Rate-limit audit trail for login endpoints (PRD §10).
CREATE TABLE auth_attempts (
	id TEXT PRIMARY KEY,
	scope TEXT NOT NULL,
	identifier TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_auth_attempts_scope_identifier_created ON auth_attempts (scope, identifier, created_at);

-- TEST FIXTURE — remove or replace before production launch.
-- Used to verify manager-tier RBAC during development.
INSERT OR IGNORE INTO users (id, email, role)
VALUES ('usr_test_manager', 'manager.test@sevatirthbhorda.org', 'manager');
