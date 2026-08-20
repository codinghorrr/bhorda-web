-- Align timeline_events copy with design-reference/our_story_timeline.html (prototype cards).

UPDATE timeline_events SET
	title_en = 'A seed in Amreshwar',
	desc_en = 'Bal Sanskar Kendra, Swadhyay Kendra, Deep Yagna, and the Jhola Pustakalay begin carrying Gurudev''s message door to door, on foot and by bullock cart.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 1
WHERE id = 'tle_amreshwar';

UPDATE timeline_events SET
	title_en = 'Reaching Dabhoi',
	desc_en = 'The Swadhyay Kendra takes root. Kanya Kaushalya Shibir begins — 35 camps and counting, shaping thousands of young girls.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 2
WHERE id = 'tle_dabhoi';

UPDATE timeline_events SET
	title_en = 'The Pragya Puran Katha begins',
	desc_en = 'Rashmikaben Patel — Pragyaputri — starts telling stories that carry Gurudev''s seven missions into every home that listens.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 3
WHERE id = 'tle_katha';

UPDATE timeline_events SET
	title_en = 'Maa Bhagwati Pragya Bhavan',
	desc_en = 'Established in Dabhoi with the blessings of Dr. Pranav Pandya, as the family outgrows its first home.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 4
WHERE id = 'tle_pragya_bhavan';

UPDATE timeline_events SET
	title_en = 'Shri Ram Shraddha Bhavan',
	desc_en = 'Inaugurated by Shukla Baba of Bihar — a larger home for a growing devotion.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 5
WHERE id = 'tle_ram_bhavan';

UPDATE timeline_events SET
	title_en = 'The Gurukul opens',
	desc_en = '24 tribal girls welcomed with free education, values, and a path to self-reliance — a promise kept for Param Vandaniya Mataji.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 6
WHERE id = 'tle_gurukul';

UPDATE timeline_events SET
	title_en = 'Shivalaya consecrated',
	desc_en = 'Its heart had already been beating since 2003 — daily Yagna, meditation, and evening aarti, without pause.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 7
WHERE id = 'tle_shivalaya';

UPDATE timeline_events SET
	title_en = 'Land given, in Bhorda',
	desc_en = 'Rashmikaben donates her ancestral land. Gayatri Kamdhenu Sevatirth is born from that single act of giving.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 8
WHERE id = 'tle_bhorda_land';

UPDATE timeline_events SET
	title_en = '108 Kundi Mahayagya',
	desc_en = 'A grand Mahayagya, presided over by Dr. Chinmay Pandya — not an ending, but a beginning for the Sevatirth.',
	title_gu = NULL,
	desc_gu = NULL,
	sort_order = 9
WHERE id = 'tle_mahayagya';

INSERT INTO timeline_events (id, year, title_en, title_gu, desc_en, desc_gu, image_url, sort_order) VALUES
('tle_today', 2026, 'A living sanctuary', NULL, '64+ tribal girls call it home. 30+ cows are cared for daily. Elders find dignity here. Every prayer, still building.', NULL, NULL, 10)
ON CONFLICT(id) DO UPDATE SET
	year = excluded.year,
	title_en = excluded.title_en,
	title_gu = excluded.title_gu,
	desc_en = excluded.desc_en,
	desc_gu = excluded.desc_gu,
	sort_order = excluded.sort_order;
