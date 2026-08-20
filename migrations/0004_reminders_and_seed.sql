-- Reminder scheduling for Anniversary/Birthday/Punyatithi donation requests (PRD §6.8).
CREATE TABLE submission_reminders (
	id TEXT PRIMARY KEY,
	submission_id TEXT NOT NULL,
	reminder_date TEXT NOT NULL,
	occasion_date TEXT NOT NULL,
	sent_at TEXT,
	FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE
);

CREATE INDEX idx_submission_reminders_due ON submission_reminders (reminder_date, sent_at);

INSERT INTO site_settings (key, value) VALUES ('staff_reminder_email', 'hello@axiso.com.au')
ON CONFLICT(key) DO NOTHING;

-- Timeline seed (PRD §6.2)
INSERT INTO timeline_events (id, year, title_en, title_gu, desc_en, desc_gu, image_url, sort_order) VALUES
('tle_amreshwar', 1990, 'Amreshwar', 'અમરેશ્વર', 'The journey begins at Amreshwar.', 'અમરેશ્વરમાં યાત્રા શરૂ થાય છે.', NULL, 1),
('tle_dabhoi', 1998, 'Dabhoi', 'દાભોઇ', 'Gayatri Pariwar presence strengthens in Dabhoi.', 'દાભોઇમાં ગાયત્રી પરિવારની ઉપસ્થિતિ મજબૂત બને છે.', NULL, 2),
('tle_katha', 1999, 'Pragya Puran Katha begins', 'પ્રજ્ઞા પુરાણ કથા શરૂ', 'The tradition of Pragya Puran Katha begins.', 'પ્રજ્ઞા પુરાણ કથાની પરંપરા શરૂ થાય છે.', NULL, 3),
('tle_pragya_bhavan', 2003, 'Maa Bhagwati Pragya Bhavan', 'મા ભગવતી પ્રજ્ઞા ભવન', 'Maa Bhagwati Pragya Bhavan is established.', 'મા ભગવતી પ્રજ્ઞા ભવન સ્થાપિત થાય છે.', NULL, 4),
('tle_ram_bhavan', 2006, 'Shri Ram Shraddha Bhavan', 'શ્રી રામ શ્રદ્ધા ભવન', 'Shri Ram Shraddha Bhavan is inaugurated.', 'શ્રી રામ શ્રદ્ધા ભવનનું ઉદ્ઘાટન થાય છે.', NULL, 5),
('tle_gurukul', 2016, 'Gurukul founded', 'ગુરુકુલની સ્થાપના', 'Gurukul is founded for values-based education.', 'મૂલ્ય આધારિત શિક્ષણ માટે ગુરુકુલની સ્થાપના.', NULL, 6),
('tle_shivalaya', 2017, 'Shivalaya', 'શિવાલય', 'Shivalaya is consecrated.', 'શિવાલયની પ્રતિષ્ઠા.', NULL, 7),
('tle_bhorda_land', 2022, 'Bhorda land donated', 'ભોરડા જમીન દાન', 'Land at Bhorda is donated for Sevatirth.', 'સેવાતીર્થ માટે ભોરડાની જમીન દાનમાં આપવામાં આવે છે.', NULL, 8),
('tle_mahayagya', 2023, '108 Kundi Mahayagya', '૧૦૮ કુંડી મહાયજ્ઞ', 'The historic 108 Kundi Mahayagya at Bhorda.', 'ભોરડામાં ઐતિહાસિક ૧૦૮ કુંડી મહાયજ્ઞ.', NULL, 9);

-- Daily rituals schedule (Activities → Daily Routine/Aarti only — NOT on Events hub)
INSERT INTO regular_schedule (id, name_en, name_gu, day_of_week, time, location, desc_en, desc_gu) VALUES
('sch_morning_aarti', 'Morning Aarti', 'સવારની આરતી', 0, '06:00', 'Main temple', 'Daily morning aarti and meditation.', 'દૈનિક સવારની આરતી અને ધ્યાન.'),
('sch_morning_aarti_wd', 'Morning Aarti', 'સવારની આરતી', 1, '06:00', 'Main temple', 'Daily morning aarti and meditation.', 'દૈનિક સવારની આરતી અને ધ્યાન.'),
('sch_evening_aarti', 'Evening Aarti', 'સાંજની આરતી', 0, '18:30', 'Main temple', 'Daily evening aarti.', 'દૈનિક સાંજની આરતી.'),
('sch_evening_aarti_wd', 'Evening Aarti', 'સાંજની આરતી', 1, '18:30', 'Main temple', 'Daily evening aarti.', 'દૈનિક સાંજની આરતી');
