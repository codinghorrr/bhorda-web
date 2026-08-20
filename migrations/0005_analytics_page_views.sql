-- First-party page view tracking for the admin Analytics Dashboard (PRD §11).
CREATE TABLE analytics_page_views (
	id TEXT PRIMARY KEY,
	path TEXT NOT NULL,
	locale TEXT NOT NULL,
	visitor_hash TEXT NOT NULL,
	viewed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_analytics_page_views_viewed_at ON analytics_page_views (viewed_at);
CREATE INDEX idx_analytics_page_views_path ON analytics_page_views (path, viewed_at);
