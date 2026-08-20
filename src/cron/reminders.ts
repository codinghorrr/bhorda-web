import { sendSesEmail } from '../lib/ses';
import { getSiteSetting } from '../lib/submissions';

type ReminderRow = {
	id: string;
	submission_id: string;
	occasion_date: string;
	payload_json: string;
};

function parsePayload(json: string): Record<string, string> {
	try {
		const parsed: unknown = JSON.parse(json);
		if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
			const out: Record<string, string> = {};
			for (const [k, v] of Object.entries(parsed)) {
				if (typeof v === 'string') out[k] = v;
			}
			return out;
		}
	} catch {
		/* ignore */
	}
	return {};
}

export async function processDueReminders(env: Env): Promise<number> {
	const today = new Date().toISOString().slice(0, 10);
	const rows = await env.DB.prepare(
		`SELECT r.id, r.submission_id, r.occasion_date, s.payload_json
		 FROM submission_reminders r
		 JOIN submissions s ON s.id = r.submission_id
		 WHERE r.reminder_date <= ? AND r.sent_at IS NULL`,
	)
		.bind(today)
		.all<ReminderRow>();

	const staffEmail =
		(await getSiteSetting(env.DB, 'staff_reminder_email')) ?? 'hello@axiso.com.au';

	let sent = 0;
	for (const row of rows.results ?? []) {
		const payload = parsePayload(row.payload_json);
		const subject = `Reminder: ${payload.occasion_type ?? 'Occasion'} on ${row.occasion_date}`;
		const text = [
			'Internal staff reminder (PRD §6.8)',
			'',
			`Occasion date: ${row.occasion_date}`,
			`Type: ${payload.occasion_type ?? '—'}`,
			`Donor name: ${payload.name ?? '—'}`,
			`Email: ${payload.email ?? '—'}`,
			`Phone: ${payload.phone ?? '—'}`,
			`Message: ${payload.message ?? '—'}`,
			'',
			`Submission ID: ${row.submission_id}`,
			'Review in Submissions Inbox at /vedmata/submissions',
		].join('\n');

		try {
			await sendSesEmail({
				region: env.SES_REGION,
				accessKeyId: env.SES_ACCESS_KEY,
				secretAccessKey: env.SES_SECRET_KEY,
				from: env.SES_FROM_EMAIL,
				to: staffEmail,
				subject,
				text,
			});
			await env.DB.prepare('UPDATE submission_reminders SET sent_at = ? WHERE id = ?')
				.bind(new Date().toISOString(), row.id)
				.run();
			sent++;
		} catch (err) {
			console.error('Reminder email failed', row.id, err);
		}
	}

	return sent;
}
