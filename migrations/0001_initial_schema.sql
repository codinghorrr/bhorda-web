-- 0001_initial_schema.sql
-- Implements PRD §8 D1 schema for sevatirthbhorda.org
-- playlists is created before gallery_audio so the foreign key can be declared.

CREATE TABLE users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL COLLATE NOCASE UNIQUE,
	role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'manager')),
	created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE otp_codes (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	code_hash TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	used_at TEXT,
	FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_otp_codes_user_id ON otp_codes (user_id);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes (expires_at);

CREATE TABLE sessions (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

CREATE TABLE spotlight_events (
	id TEXT PRIMARY KEY,
	type TEXT NOT NULL,
	title_en TEXT NOT NULL,
	title_gu TEXT,
	desc_en TEXT,
	desc_gu TEXT,
	date_start TEXT NOT NULL,
	date_end TEXT,
	location TEXT,
	photo_url TEXT,
	status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'past'))
);

CREATE INDEX idx_spotlight_events_status_date ON spotlight_events (status, date_start);
CREATE INDEX idx_spotlight_events_type ON spotlight_events (type);

CREATE TABLE regular_schedule (
	id TEXT PRIMARY KEY,
	name_en TEXT NOT NULL,
	name_gu TEXT,
	day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
	time TEXT NOT NULL,
	location TEXT,
	desc_en TEXT,
	desc_gu TEXT
);

CREATE INDEX idx_regular_schedule_day ON regular_schedule (day_of_week);

CREATE TABLE playlists (
	id TEXT PRIMARY KEY,
	name_en TEXT NOT NULL,
	name_gu TEXT,
	type TEXT NOT NULL CHECK (type IN ('audio', 'video'))
);

CREATE TABLE gallery_photo (
	id TEXT PRIMARY KEY,
	url TEXT NOT NULL,
	activity_tag TEXT,
	event_id TEXT,
	caption_en TEXT,
	caption_gu TEXT,
	FOREIGN KEY (event_id) REFERENCES spotlight_events (id) ON DELETE SET NULL
);

CREATE INDEX idx_gallery_photo_event_id ON gallery_photo (event_id);
CREATE INDEX idx_gallery_photo_activity_tag ON gallery_photo (activity_tag);

CREATE TABLE gallery_audio (
	id TEXT PRIMARY KEY,
	file_url TEXT NOT NULL,
	title_en TEXT NOT NULL,
	title_gu TEXT,
	composer TEXT,
	playlist_id TEXT,
	lyrics_gu TEXT,
	lyrics_translit TEXT,
	FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE SET NULL
);

CREATE INDEX idx_gallery_audio_playlist_id ON gallery_audio (playlist_id);

CREATE TABLE gallery_video (
	id TEXT PRIMARY KEY,
	youtube_url TEXT NOT NULL,
	thumbnail_url TEXT,
	title_en TEXT NOT NULL,
	title_gu TEXT,
	desc_en TEXT,
	desc_gu TEXT,
	event_id TEXT,
	day_number INTEGER,
	FOREIGN KEY (event_id) REFERENCES spotlight_events (id) ON DELETE SET NULL
);

CREATE INDEX idx_gallery_video_event_id ON gallery_video (event_id);

CREATE TABLE stall_items (
	id TEXT PRIMARY KEY,
	name_en TEXT NOT NULL,
	name_gu TEXT,
	price REAL NOT NULL CHECK (price >= 0),
	photo_url TEXT,
	in_stock INTEGER NOT NULL DEFAULT 1 CHECK (in_stock IN (0, 1))
);

CREATE TABLE page_text (
	id TEXT PRIMARY KEY,
	page_key TEXT NOT NULL,
	block_key TEXT NOT NULL,
	content_en TEXT,
	content_gu TEXT,
	UNIQUE (page_key, block_key)
);

CREATE TABLE timeline_events (
	id TEXT PRIMARY KEY,
	year INTEGER NOT NULL,
	title_en TEXT NOT NULL,
	title_gu TEXT,
	desc_en TEXT,
	desc_gu TEXT,
	image_url TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_timeline_events_sort ON timeline_events (sort_order, year);

CREATE TABLE submissions (
	id TEXT PRIMARY KEY,
	form_type TEXT NOT NULL,
	payload_json TEXT NOT NULL,
	submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	handled INTEGER NOT NULL DEFAULT 0 CHECK (handled IN (0, 1)),
	handled_by TEXT,
	handled_at TEXT,
	FOREIGN KEY (handled_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_submissions_form_type ON submissions (form_type);
CREATE INDEX idx_submissions_handled_submitted ON submissions (handled, submitted_at);

CREATE TABLE site_settings (
	key TEXT PRIMARY KEY,
	value TEXT
);

-- Phase 0 seed: Superadmin identity (PRD §4). Password is a Worker secret, not stored here.
INSERT INTO users (id, email, role)
VALUES ('usr_superadmin', 'hello@axiso.com.au', 'superadmin');
