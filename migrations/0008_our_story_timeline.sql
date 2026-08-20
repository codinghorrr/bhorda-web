-- Our Story timeline: enriched English copy, Gujarati cleared for progressive translation, "Today" milestone added.

UPDATE timeline_events SET
	title_en = 'Amreshwar',
	desc_en = 'The journey begins at Amreshwar — the first centre where Gayatri Pariwar families gathered for yagya, swadhyay, and community seva.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 1
WHERE id = 'tle_amreshwar';

UPDATE timeline_events SET
	title_en = 'Dabhoi',
	desc_en = 'Gayatri Pariwar presence strengthens in Dabhoi — a regional hub for yagya, youth programmes, and festival celebrations.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 2
WHERE id = 'tle_dabhoi';

UPDATE timeline_events SET
	title_en = 'Pragya Puran Katha begins',
	desc_en = 'The tradition of multi-day Pragya Puran Katha begins — scripture, reform, and sadhana woven into one living experience.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 3
WHERE id = 'tle_katha';

UPDATE timeline_events SET
	title_en = 'Maa Bhagwati Pragya Bhavan',
	desc_en = 'Maa Bhagwati Pragya Bhavan is established — a dedicated space for women''s leadership and cultural programmes.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 4
WHERE id = 'tle_pragya_bhavan';

UPDATE timeline_events SET
	title_en = 'Shri Ram Shraddha Bhavan',
	desc_en = 'Shri Ram Shraddha Bhavan is inaugurated — expanding the campus for larger yagyas and collective celebrations.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 5
WHERE id = 'tle_ram_bhavan';

UPDATE timeline_events SET
	title_en = 'Gurukul founded',
	desc_en = 'Gurukul is founded for values-based education — today home to 64+ tribal girls receiving free schooling and sanskar.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 6
WHERE id = 'tle_gurukul';

UPDATE timeline_events SET
	title_en = 'Shivalaya',
	desc_en = 'Shivalaya is consecrated — anchoring daily aarti, meditation, and the spiritual rhythm of the campus.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 7
WHERE id = 'tle_shivalaya';

UPDATE timeline_events SET
	title_en = 'Bhorda land donated',
	desc_en = 'Land at Bhorda is donated for Sevatirth — the site that would unite gaushala, gurukul, and Mavtardham.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 8
WHERE id = 'tle_bhorda_land';

UPDATE timeline_events SET
	title_en = '108 Kundi Mahayagya',
	desc_en = 'The historic 108 Kundi Mahayagya at Bhorda draws volunteers and seekers from across the region.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 9
WHERE id = 'tle_mahayagya';

INSERT INTO timeline_events (id, year, title_en, title_gu, desc_en, desc_gu, image_url, sort_order) VALUES
('tle_today', 2026, 'Today', NULL, 'Gayatri Kamdhenu Sevatirth Bhorda welcomes seekers to gaushala, gurukul, Mavtardham, and daily sadhana — the story continues in every act of seva.', NULL, NULL, 10)
ON CONFLICT(id) DO UPDATE SET
	year = excluded.year,
	title_en = excluded.title_en,
	title_gu = excluded.title_gu,
	desc_en = excluded.desc_en,
	desc_gu = excluded.desc_gu,
	sort_order = excluded.sort_order;
