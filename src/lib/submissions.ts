import { randomId } from './crypto';

export type SubmissionPayload = Record<string, string | number | boolean | null>;

export async function createSubmission(
	db: D1Database,
	formType: string,
	payload: SubmissionPayload,
): Promise<string> {
	const id = randomId('sub');
	await db
		.prepare('INSERT INTO submissions (id, form_type, payload_json) VALUES (?, ?, ?)')
		.bind(id, formType, JSON.stringify(payload))
		.run();
	return id;
}

const REMINDER_DAYS_BEFORE = 3;

export async function scheduleOccasionReminder(
	db: D1Database,
	submissionId: string,
	occasionDateIso: string,
): Promise<void> {
	const occasion = new Date(`${occasionDateIso}T00:00:00.000Z`);
	if (Number.isNaN(occasion.getTime())) {
		return;
	}

	const reminder = new Date(occasion);
	reminder.setUTCDate(reminder.getUTCDate() - REMINDER_DAYS_BEFORE);
	const reminderDate = reminder.toISOString().slice(0, 10);
	const today = new Date().toISOString().slice(0, 10);

	if (reminderDate < today) {
		return;
	}

	const id = randomId('rem');
	await db
		.prepare(
			'INSERT INTO submission_reminders (id, submission_id, reminder_date, occasion_date) VALUES (?, ?, ?, ?)',
		)
		.bind(id, submissionId, reminderDate, occasionDateIso)
		.run();
}

export async function getSiteSetting(db: D1Database, key: string): Promise<string | null> {
	try {
		const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(key).first<{ value: string }>();
		return row?.value ?? null;
	} catch {
		return null;
	}
}
