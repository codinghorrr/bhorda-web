import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { ensureTestMigrations } from './helpers/migrations';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

beforeAll(async () => {
	await ensureTestMigrations(env.DB);
});

describe('public pages', () => {
	it('renders About landing in English', async () => {
		const request = new IncomingRequest('http://example.com/en/about');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('about-mission-title');
		expect(html).not.toContain('about-vision-title');
	});

	it('renders Our Story timeline in Gujarati', async () => {
		const request = new IncomingRequest('http://example.com/gu/about/our-story');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('story-scroll-timeline');
		expect(html).toContain('1990');
		expect(html).toContain('translation-banner');
		expect(html).toContain('Amreshwar');
		expect(html).toContain('A seed in Amreshwar');
	});

	it('renders Our Story narrative and stats in English', async () => {
		const request = new IncomingRequest('http://example.com/en/about/our-story');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('our-story-head');
		expect(html).toContain('our-story-narrative');
		expect(html).toContain('story-stats');
		expect(html).toContain('story-scroll-timeline');
		expect(html).toContain('64+');
		expect(html).toContain('our-story-timeline.js');
		expect(html).toContain('A journey of thirty-five years');
	});

	it('renders Events hub with spotlight and schedule sections', async () => {
		const request = new IncomingRequest('http://example.com/en/events');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('events-section--spotlight');
		expect(html).toContain('events-section--schedule');
		expect(html).not.toContain('daily-rituals-title');
	});

	it('renders daily rituals on Activities page only', async () => {
		const request = new IncomingRequest('http://example.com/en/activities/daily-routine-aarti');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('Daily rituals schedule');
	});

	it('renders gallery photos with filters', async () => {
		const request = new IncomingRequest('http://example.com/en/gallery/photos');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('filter-chip');
	});
});

describe('form submissions', () => {
	it('creates a sanskar request submission', async () => {
		const body = new URLSearchParams({
			form_type: 'sanskar_request',
			locale: 'en',
			name: 'Test User',
			email: 'test@example.com',
			phone: '9999999999',
			message: 'Interested in Namakarana',
			sanskar: 'namakarana',
		});

		const request = new IncomingRequest('http://example.com/api/forms/submit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: body.toString(),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const json = await response.json<{ ok: boolean }>();
		expect(json.ok).toBe(true);

		const row = await env.DB.prepare(
			"SELECT form_type, payload_json FROM submissions WHERE form_type = 'sanskar_request' ORDER BY submitted_at DESC LIMIT 1",
		).first<{ form_type: string; payload_json: string }>();
		expect(row?.form_type).toBe('sanskar_request');
		const payload = JSON.parse(row!.payload_json) as { name: string; sanskar: string };
		expect(payload.name).toBe('Test User');
		expect(payload.sanskar).toBe('namakarana');
	});

	it('maps anniversary donation type and schedules reminder', async () => {
		const occasionDate = '2030-06-15';
		const body = new URLSearchParams({
			form_type: 'donation_general',
			locale: 'en',
			donation_type: 'anniversary_birthday_punyatithi',
			occasion_type: 'anniversary',
			occasion_date: occasionDate,
			name: 'Donor Test',
			email: 'donor@example.com',
			message: 'Anniversary seva',
		});

		const request = new IncomingRequest('http://example.com/api/forms/submit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: body.toString(),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);

		const sub = await env.DB.prepare(
			"SELECT id FROM submissions WHERE form_type = 'donation_anniversary' ORDER BY submitted_at DESC LIMIT 1",
		).first<{ id: string }>();
		expect(sub?.id).toBeTruthy();

		const reminder = await env.DB.prepare(
			'SELECT occasion_date FROM submission_reminders WHERE submission_id = ?',
		)
			.bind(sub!.id)
			.first<{ occasion_date: string }>();
		expect(reminder?.occasion_date).toBe(occasionDate);
	});
});
