#!/usr/bin/env node
/**
 * Generates migrations/0006_launch_content.sql from inline launch copy.
 * Run: node scripts/generate-launch-migration.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

function esc(s) {
	return s.replace(/'/g, "''").replace(/\r?\n/g, ' ');
}

function pageText(id, pageKey, blockKey, en, gu = null) {
	const guVal = gu ? `'${esc(gu)}'` : 'NULL';
	return `('${id}', '${pageKey}', '${blockKey}', '${esc(en)}', ${guVal})`;
}

const rows = [];

function addPage(pageKey, titleEn, bodyEn, extras = {}) {
	const prefix = pageKey.replace(/[^a-z0-9]+/gi, '_').slice(0, 24);
	rows.push(pageText(`pt_${prefix}_title`, pageKey, 'title', titleEn));
	rows.push(pageText(`pt_${prefix}_body`, pageKey, 'body', bodyEn));
	for (const [key, en] of Object.entries(extras)) {
		rows.push(pageText(`pt_${prefix}_${key}`, pageKey, key, en));
	}
}

addPage(
	'about',
	'About Gayatri Kamdhenu Sevatirth',
	'Gayatri Kamdhenu Sevatirth, Bhorda is affiliated with All World Gayatri Pariwar (AWGP.org), inspired by the vision of Pandit Shriram Sharma Acharya.\n\nWe welcome families, youth, and seekers to participate in seva, sadhana, yagya, education, and community upliftment at our campus in Bhorda, Gujarat.',
	{
		mission:
			'Our mission is to nurture seva, sadhana, and values-based living — strengthening character, compassion, and self-reliance in harmony with Gayatri Pariwar ideals.',
	},
);

addPage(
	'about-our-story',
	'Our Story',
	'A visual journey through milestones of Gayatri Pariwar at Bhorda and beyond — from Amreshwar to the historic 108 Kundi Mahayagya.',
);

const aboutPages = {
	'about-pandit-shriram': [
		'Pandit Shriram Sharma Acharya',
		'Founder of the Gayatri Pariwar movement, Pandit Shriram Sharma Acharya (1911–1990) dedicated his life to spiritual awakening, social reform, and the revival of yagya culture. His writings and guidance continue to inspire millions worldwide.',
	],
	'about-mata-bhagwati': [
		'Vandaniya Mata Bhagwati Devi Sharma',
		'Mata Bhagwati Devi Sharma embodied selfless seva alongside Gurudev. Her life of simplicity, courage, and devotion remains a guiding light for Gayatri Pariwar families.',
	],
	'about-vedmata-gayatri': [
		'Vedmata Gayatri',
		'Gayatri is revered as Vedmata — the mother of the Vedas. Daily Gayatri japa and yagya sadhana form the spiritual foundation of our activities at Sevatirth Bhorda.',
	],
	'about-awgp': [
		'All World Gayatri Pariwar',
		'AWGP is a global movement with millions of members, rooted in the vision of a balanced society through spirituality, education, and constructive programmes. Learn more at awgp.org.',
	],
	'about-dr-chinmay': [
		'Present Mentor — Dr. Chinmay Pandya',
		'Dr. Chinmay Pandya serves as a guiding voice for Gayatri Pariwar today, carrying forward Gurudev\'s mission through discourse, writing, and institutional leadership.',
	],
	'about-mission-vision': [
		'Mission & Vision',
		'Mission: Integrate spirituality with practical living through seva, sadhana, and community programmes.\n\nVision: A self-reliant, values-based society where every family participates in yagya culture and constructive action.',
	],
	'about-dabhoi': [
		'Gayatri Pariwar Dabhoi',
		'The Dabhoi centre has been a long-standing hub of Gayatri Pariwar activity in the region. Sevatirth Bhorda extends this legacy on the land generously donated for seva and sadhana.',
	],
};

for (const [key, [title, body]] of Object.entries(aboutPages)) {
	addPage(key, title, body);
}

const activityPages = {
	'activity-yagya': ['Yagya', 'Daily and special yagyas are performed to purify the environment and consciousness. Families and volunteers are welcome to participate in havan and collective sadhana.'],
	'activity-zhola': ['Zhola Pustakalay', 'A travelling library programme bringing spiritual and values-based literature to villages and schools.'],
	'activity-trees': ['Tree Planting', 'Environmental seva through tree plantation drives, organic awareness, and care for native species on campus.'],
	'activity-sadhana': ['Sadhana', 'Morning and evening group sadhana including Gayatri japa, meditation, and guided reflection.'],
	'activity-daily-routine': ['Daily Routine / Aarti', 'The daily rhythm of temple aarti, meditation, and community prayer — see the schedule table below.'],
	'activity-swadhyay': ['Swadhyay', 'Study circles on Gurudev\'s literature, Vichar Kranti, and applied spirituality in daily life.'],
	'activity-festivals': ['Festival Celebrations', 'Major festivals and parvas are celebrated with yagya, cultural programmes, and community meals.'],
	'activity-farming': ['Organic Farming', 'Organic cultivation on campus supports the gaushala and community kitchen with chemical-free produce.'],
	'activity-medical': ['Vaccination & Medical Camps', 'Periodic health camps and vaccination drives serve nearby villages in partnership with local volunteers.'],
	'activity-bal-sanskar': ['Bal Sanskar Shala', 'Weekend values education for children through stories, games, mantra, and creative activities.'],
	'activity-youth': ['Youth Cell', 'Youth-led seva projects, leadership training, and engagement with AWGP programmes.'],
	'activity-self-reliance': ['Self-Reliance Training', 'Skill-building workshops encouraging entrepreneurship and constructive livelihoods.'],
	'activity-games': ['Games / Annual Celebration', 'Sports, games, and annual cultural celebrations bringing families together.'],
};

for (const [key, [title, body]] of Object.entries(activityPages)) {
	addPage(key, title, body);
}

const sanskarTiming = {
	'garbhadhan': 'Before conception — contact for guidance',
	'punsavan': 'Third month of pregnancy',
	'simantonayan': 'Seventh month of pregnancy',
	'jatakarma': 'At birth',
	'namakarana': '11th day after birth',
	'nishkramana': 'Fourth month — first outing',
	'annaprashan': 'Sixth month — first solid food',
	'chudakarana': 'First year or third year — mundan',
	'karnavedha': 'Third or fifth year',
	'vidyarambha': 'Age 3–5 — beginning of learning',
	'upanayana': 'Age 8–12 — sacred thread',
	'vedarambha': 'After Upanayana — study of Vedas',
	'samavartana': 'Completion of formal study',
	'vivaha': 'Marriage — by appointment',
	'vanaprastha': 'Transition to spiritual retirement',
	'antyesti': 'Final rites — contact for support',
};

const sanskarLabels = {
	garbhadhan: 'Garbhadhan',
	punsavan: 'Punsavan',
	simantonayan: 'Simantonayan',
	jatakarma: 'Jatakarma',
	namakarana: 'Namakarana',
	nishkramana: 'Nishkramana',
	annaprashan: 'Annaprashan',
	chudakarana: 'Chudakarana (Mundan)',
	karnavedha: 'Karnavedha',
	vidyarambha: 'Vidyarambha',
	upanayana: 'Upanayana',
	vedarambha: 'Vedarambha',
	samavartana: 'Samavartana',
	vivaha: 'Vivaha',
	vanaprastha: 'Vanaprastha',
	antyesti: 'Antyesti',
};

for (const [slug, title] of Object.entries(sanskarLabels)) {
	const pageKey = `sanskar-${slug}`;
	const body = `The ${title} sanskar is performed according to Vedic tradition at Sevatirth Bhorda. Our priests and volunteers guide families through preparation, mantras, and the ceremony itself.`;
	addPage(pageKey, title, body, { timing: sanskarTiming[slug] });
}

addPage(
	'gaushala',
	'Gaushala',
	'Cow seva is central to our campus life. The gaushala provides care, fodder, and medical attention for cows while promoting organic farming and Gau Seva opportunities for devotees.',
);

addPage(
	'gurukul',
	'Gurukul',
	'Values-based education for children and youth — combining academic support, sanskar, sports, and daily sadhana in a Gurukul atmosphere.',
);

const homeBlocks = {
	hero_title: 'Welcome to Gayatri Kamdhenu Sevatirth',
	hero_lead:
		'A living centre of seva, sadhana, and Gayatri Pariwar values in Bhorda — welcoming families, seekers, and volunteers.',
	highlight_gaushala: 'Cow seva, organic care, and Gau Seva opportunities for the community.',
	highlight_gurukul: 'Values-based learning for children and youth rooted in Indian culture.',
	highlight_mavtardham: 'A sacred space for remembrance, prayer, and quiet reflection.',
	updates_teaser: 'Explore spotlight events, the weekly schedule, and gallery highlights from campus life.',
	connect_cta:
		'Share your interest in seva, visits, donations, or volunteering — our team will respond personally.',
};

for (const [block, en] of Object.entries(homeBlocks)) {
	rows.push(pageText(`pt_home_${block}`, 'home', block, en));
}

const sql = `-- Launch content seed (PRD 6.1 - English at launch, Gujarati added progressively)
INSERT INTO page_text (id, page_key, block_key, content_en, content_gu) VALUES
${rows.join(',\n')}
ON CONFLICT(page_key, block_key) DO UPDATE SET
  content_en = excluded.content_en,
  content_gu = COALESCE(excluded.content_gu, page_text.content_gu);

-- Spotlight events
INSERT INTO spotlight_events (id, type, title_en, title_gu, desc_en, desc_gu, date_start, date_end, location, photo_url, status) VALUES
('se_mahayagya_2023', 'Festival', '108 Kundi Mahayagya', NULL,
 'The historic 108 Kundi Mahayagya at Bhorda brought together thousands of participants for collective havan and spiritual renewal.',
 NULL, '2023-11-01', '2023-11-09', 'Sevatirth Bhorda campus', NULL, 'past'),
('se_weekly_yagya', 'Event', 'Weekly Community Yagya', NULL,
 'Open community yagya every Sunday morning. Families welcome — please arrive 15 minutes early for seating.',
 NULL, '2026-08-24', NULL, 'Main yagya shala', NULL, 'published'),
('se_gurukul_open', 'Shibir', 'Gurukul Open Day', NULL,
 'Visit classrooms, meet teachers, and learn about values-based programmes for children and youth.',
 NULL, '2026-09-14', NULL, 'Gurukul building', NULL, 'published')
ON CONFLICT(id) DO UPDATE SET
  title_en = excluded.title_en,
  desc_en = excluded.desc_en,
  date_start = excluded.date_start,
  status = excluded.status;

-- Video gallery (YouTube links — PRD §6.4)
INSERT INTO gallery_video (id, youtube_url, thumbnail_url, title_en, title_gu, desc_en, desc_gu, event_id, day_number) VALUES
('gv_awgp_intro', 'https://www.youtube.com/watch?v=lw2l0aLBMRA', NULL,
 'Gayatri Pariwar — message of Gurudev', NULL,
 'Inspirational message from the Gayatri Pariwar tradition. Replace with your preferred AWGP video via admin.', NULL, NULL, NULL),
('gv_mahayagya_day1', 'https://www.youtube.com/watch?v=lw2l0aLBMRA', NULL,
 '108 Kundi Mahayagya — Day 1', NULL,
 'Highlights from the first day of the Mahayagya at Bhorda.', NULL, 'se_mahayagya_2023', 1)
ON CONFLICT(id) DO UPDATE SET
  youtube_url = excluded.youtube_url,
  title_en = excluded.title_en,
  desc_en = excluded.desc_en;
`;

const out = path.join(process.cwd(), 'migrations/0006_launch_content.sql');
fs.writeFileSync(out, sql);
console.log('Wrote', out, 'with', rows.length, 'page_text rows');
