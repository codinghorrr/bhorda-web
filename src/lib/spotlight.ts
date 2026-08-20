export const SPOTLIGHT_TYPES = [
	'Event',
	'Festival',
	'Shibir',
	'Katha',
	'Medical Camp',
	'Yagya',
	'Other',
] as const;

export type SpotlightStatus = 'draft' | 'published' | 'past';

export function computeSpotlightStatus(
	dateStart: string,
	dateEnd: string | null,
	now = new Date(),
): SpotlightStatus {
	const effectiveEnd = dateEnd && dateEnd.trim().length > 0 ? dateEnd : dateStart;
	const end = new Date(`${effectiveEnd}T23:59:59.999Z`);
	if (!Number.isNaN(end.getTime()) && end < now) {
		return 'past';
	}
	return 'published';
}

export async function refreshPastSpotlightEvents(db: D1Database): Promise<void> {
	const nowIso = new Date().toISOString().slice(0, 10);
	await db
		.prepare(
			`UPDATE spotlight_events
			 SET status = 'past'
			 WHERE status != 'draft'
			   AND COALESCE(NULLIF(date_end, ''), date_start) < ?`,
		)
		.bind(nowIso)
		.run();
}
