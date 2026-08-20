import migration0001 from '../../migrations/0001_initial_schema.sql?raw';
import migration0002 from '../../migrations/0002_auth_attempts_and_test_manager.sql?raw';
import migration0003 from '../../migrations/0003_gallery_audio_description.sql?raw';

let applied = false;

function splitSqlStatements(sql: string): string[] {
	return sql
		.split(';')
		.map((part) =>
			part
				.split('\n')
				.filter((line) => !line.trim().startsWith('--'))
				.join('\n')
				.trim(),
		)
		.filter((statement) => statement.length > 0);
}

async function execMigration(db: D1Database, sql: string): Promise<void> {
	for (const statement of splitSqlStatements(sql)) {
		await db.prepare(statement).run();
	}
}

export async function ensureTestMigrations(db: D1Database): Promise<void> {
	if (applied) {
		return;
	}
	await execMigration(db, migration0001);
	await execMigration(db, migration0002);
	await execMigration(db, migration0003);
	applied = true;
}
