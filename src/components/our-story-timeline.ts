import type { Locale } from '../lib/i18n';
import { escapeHtml } from '../lib/html';
import {
	OUR_STORY_STATS,
	ourStoryNarrative,
	ourStoryStatLabel,
	type OurStoryMeta,
} from '../lib/our-story-narrative';

export type StoryTimelineEvent = {
	id: string;
	year: number;
	title: string;
	description: string;
	imageUrl: string | null;
	translationPending: boolean;
};

export function renderOurStoryPageHead(meta: OurStoryMeta): string {
	return `<header class="our-story-head">
	<p class="hero-om" aria-hidden="true">ॐ</p>
	<h1 class="our-story-head__title">${escapeHtml(meta.pageTitle)}</h1>
	<span class="our-story-head__rule" aria-hidden="true"></span>
	<p class="our-story-head__intro">${escapeHtml(meta.intro)}</p>
</header>`;
}

export function renderOurStoryNarrative(locale: Locale): string {
	const { paragraphs, translationPending: narrativePending } = ourStoryNarrative(locale);
	const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
	const note =
		narrativePending && locale === 'gu'
			? `<p class="our-story-narrative__note" role="status">${escapeHtml('ગુજરાતી અનુવાદ બાકી છે — અંગ્રેજી સામગ્રી બતાવવામાં આવે છે.')}</p>`
			: '';
	return `<section class="our-story-narrative" aria-labelledby="our-story-narrative-title">
	<h2 id="our-story-narrative-title" class="visually-hidden">${locale === 'gu' ? 'કથા' : 'Narrative'}</h2>
	${note}
	<div class="our-story-narrative__body">${body}</div>
</section>`;
}

export function renderOurStoryStats(locale: Locale): string {
	const cards = OUR_STORY_STATS.map(
		(stat) => `<div class="story-stat-card">
	<span class="story-stat-card__value">${escapeHtml(stat.value)}</span>
	<span class="story-stat-card__label">${escapeHtml(ourStoryStatLabel(locale, stat))}</span>
</div>`,
	).join('\n');

	return `<section class="story-stats" aria-label="${locale === 'gu' ? 'મુખ્ય આંકડા' : 'Key figures'}">
	<div class="story-stats__grid">${cards}</div>
</section>`;
}

function timelineYearDisplay(event: StoryTimelineEvent): { dataYear: string; yearLabel: string; datetime: string } {
	if (event.id === 'tle_today') {
		return { dataYear: 'Today', yearLabel: 'TODAY', datetime: '2026' };
	}
	return { dataYear: String(event.year), yearLabel: String(event.year), datetime: String(event.year) };
}

export function renderOurStoryScrollTimeline(events: StoryTimelineEvent[], locale: Locale): string {
	if (events.length === 0) {
		return `<p class="lead">${locale === 'gu' ? 'સમયરેખા ટૂંક સમયમાં ઉપલબ્ધ થશે.' : 'Timeline content will appear here soon.'}</p>`;
	}

	const recentIds = new Set(events.slice(-2).map((e) => e.id));
	const label = locale === 'gu' ? 'સમયરેખા' : 'Timeline';

	const items = events
		.map((event) => {
			const { dataYear, yearLabel, datetime } = timelineYearDisplay(event);
			const latest = recentIds.has(event.id) ? ' is-latest' : '';
			const pending = event.translationPending
				? `<span class="story-timeline-card__pending">${locale === 'gu' ? 'અનુવાદ બાકી' : 'Translation pending'}</span>`
				: '';
			const image = event.imageUrl
				? `<img class="story-timeline-card__image" src="${escapeHtml(event.imageUrl)}" alt="" loading="lazy" width="320" height="180" />`
				: '';

			return `<li class="story-scroll-timeline__item${latest}" data-story-year="${escapeHtml(dataYear)}" data-story-year-label="${escapeHtml(yearLabel)}">
	<span class="story-scroll-timeline__dot" aria-hidden="true"></span>
	<article class="story-timeline-card">
		<div class="story-timeline-card__year"><time datetime="${escapeHtml(datetime)}">${escapeHtml(yearLabel)}</time></div>
		<h3 class="story-timeline-card__title">${escapeHtml(event.title)}${pending}</h3>
		${image}
		<p class="story-timeline-card__desc">${escapeHtml(event.description)}</p>
	</article>
</li>`;
		})
		.join('\n');

	return `<section class="story-scroll-timeline" data-story-timeline aria-label="${escapeHtml(label)}">
	<div class="story-scroll-timeline__spine" aria-hidden="true"><div class="story-scroll-timeline__spine-fill"></div></div>
	<ol class="story-scroll-timeline__list">${items}</ol>
	<div class="story-scroll-timeline__progress-label" data-story-progress-label aria-hidden="true"></div>
</section>`;
}

export const OUR_STORY_TIMELINE_SCRIPT = '/scripts/our-story-timeline.js';

export function ourStoryTimelineHeadExtras(): string {
	return `<script src="${OUR_STORY_TIMELINE_SCRIPT}" defer></script>`;
}
