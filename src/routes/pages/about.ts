import { renderPageShell } from '../../components/layout';
import {
	ourStoryTimelineHeadExtras,
	renderOurStoryNarrative,
	renderOurStoryPageHead,
	renderOurStoryScrollTimeline,
	renderOurStoryStats,
	type StoryTimelineEvent,
} from '../../components/our-story-timeline';
import { renderSubNav } from '../../components/public-page';
import { getPageText } from '../../lib/content';
import { escapeHtml } from '../../lib/html';
import type { Locale } from '../../lib/i18n';
import { localizedPath } from '../../lib/i18n';
import { loadPageContent, pickLocalized, pageHeading } from '../../lib/page-helpers';
import { ourStoryMeta, ourStoryNarrative } from '../../lib/our-story-narrative';
import { ABOUT_PAGES } from '../../lib/site-structure';
import { siteCopy } from '../../lib/site';

const ABOUT_FALLBACK: Record<string, { en: { title: string; body: string }; gu: { title: string; body: string } }> = {
	about: {
		en: {
			title: 'About Gayatri Kamdhenu Sevatirth',
			body: 'Gayatri Kamdhenu Sevatirth, Bhorda is affiliated with All World Gayatri Pariwar (AWGP.org), a global movement inspired by the vision of Pandit Shriram Sharma Acharya.\n\nOur mission is to nurture seva, sadhana, and values-based living — welcoming families, youth, and seekers to participate in yagya, education, gaushala care, and community upliftment.',
		},
		gu: {
			title: 'ગાયત્રી કામધેનુ સેવાતીર્થ વિશે',
			body: 'ગાયત્રી કામધેનુ સેવાતીર્થ, ભોરડા ઓલ વર્લ્ડ ગાયત્રી પરિવાર (AWGP.org) સાથે જોડાયેલ છે — પંડિત શ્રીરામ શર્મા આચાર્યની દ્રષ્ટિ પ્રેરિત વૈશ્વિક આંદોલન.\n\nઅમારું મિશન સેવા, સાધના અને મૂલ્ય આધારિત જીવનને પોષવાનું છે.',
		},
	},
	'about-our-story': {
		en: { title: 'Our Story', body: 'A visual journey through milestones of Gayatri Pariwar at Bhorda and beyond.' },
		gu: { title: 'અમારી કથા', body: 'ભોરડા અને આગળના ગાયત્રી પરિવારના માઇલસ્ટોનની દૃશ્ય યાત્રા.' },
	},
};

function aboutSubNav(locale: Locale, pathname: string) {
	const base = localizedPath(locale, '/about');
	return renderSubNav(locale, [
		{ href: base, label: locale === 'gu' ? 'વિશે' : 'Overview', active: pathname === '/about' },
		...ABOUT_PAGES.map((p) => ({
			href: `${base}/${p.slug}`,
			label: pickLocalized(locale, p.labels),
			active: pathname === `/about/${p.slug}`,
		})),
	]);
}

async function loadStoryTimeline(db: D1Database, locale: Locale): Promise<{ events: StoryTimelineEvent[]; translationPending: boolean }> {
	const rows = await db
		.prepare('SELECT id, year, title_en, title_gu, desc_en, desc_gu, image_url FROM timeline_events ORDER BY sort_order, year')
		.all<{
			id: string;
			year: number;
			title_en: string;
			title_gu: string | null;
			desc_en: string | null;
			desc_gu: string | null;
			image_url: string | null;
		}>();

	let translationPending = false;
	const events =
		rows.results?.map((row) => {
			const guTitle = (row.title_gu ?? '').trim();
			const guDesc = (row.desc_gu ?? '').trim();
			const useGu = locale === 'gu' && guTitle.length > 0;
			if (locale === 'gu' && (!guTitle || !guDesc)) {
				translationPending = true;
			}
			return {
				id: row.id,
				year: row.year,
				title: useGu ? guTitle : row.title_en,
				description: locale === 'gu' && guDesc ? guDesc : row.desc_en ?? '',
				imageUrl: row.image_url,
				translationPending: locale === 'gu' && (!guTitle || !guDesc),
			};
		}) ?? [];

	return { events, translationPending };
}

export async function renderAboutPage(
	env: Env,
	locale: Locale,
	pathname: string,
	origin: string,
	url: URL,
): Promise<string | null> {
	const copy = siteCopy(locale);
	const subNav = aboutSubNav(locale, pathname);

	if (pathname === '/about') {
		const fb = ABOUT_FALLBACK.about[locale];
		const content = await loadPageContent(env.DB, locale, {
			pageKey: 'about',
			fallbackTitle: fb.title,
			fallbackBody: fb.body,
		});
		const mission = await getPageText(env.DB, 'about', 'mission', locale);
		const missionText = mission.text || fb.body.split('\n\n')[1] || fb.body;

		const main = `<div class="container page-about">
${subNav}
${pageHeading(content.title)}
<div class="about-affiliation card">
	<p><strong>AWGP.org</strong> — ${locale === 'gu' ? 'ઓલ વર્લ્ડ ગાયત્રી પરિવાર સાથે સંલગ્નતા' : 'Affiliated with All World Gayatri Pariwar'}</p>
</div>
<section class="section" aria-labelledby="about-mission-title">
	<h2 id="about-mission-title" class="section-title">${locale === 'gu' ? 'મિશન' : 'Mission'}</h2>
	<div class="rich-text">${missionText.split('\n').map((l) => `<p>${escapeHtml(l)}</p>`).join('')}</div>
</section>
</div>`;

		return renderPageShell({
			locale,
			pathname,
			title: `${content.title} | ${copy.siteName}`,
			origin,
			main,
			translationPending: content.translationPending,
			env,
			url,
		});
	}

	if (pathname === '/about/our-story') {
		const meta = ourStoryMeta(locale);
		const { events, translationPending: timelinePending } = await loadStoryTimeline(env.DB, locale);
		const narrative = ourStoryNarrative(locale);

		const main = `<div class="page-our-story">
${subNav}
<div class="container page-our-story__inner">
${renderOurStoryPageHead(meta)}
${renderOurStoryNarrative(locale)}
</div>
${renderOurStoryStats(locale)}
<div class="container page-our-story__timeline">
${renderOurStoryScrollTimeline(events, locale)}
</div>
</div>`;

		return renderPageShell({
			locale,
			pathname,
			title: meta.title,
			description: meta.description,
			origin,
			main,
			translationPending: timelinePending || narrative.translationPending,
			headExtras: ourStoryTimelineHeadExtras(),
			env,
			url,
		});
	}

	const page = ABOUT_PAGES.find((p) => pathname === `/about/${p.slug}`);
	if (!page) return null;

	const fb = {
		title: pickLocalized(locale, page.labels),
		body:
			locale === 'gu'
				? 'આ પૃષ્ઠની વિગતવાર માહિતી ટૂંક સમયમાં ઉપલબ્ધ થશે.'
				: 'Detailed content for this page will be published soon.',
	};
	const content = await loadPageContent(env.DB, locale, {
		pageKey: page.pageKey,
		fallbackTitle: fb.title,
		fallbackBody: fb.body,
	});

	const main = `<div class="container page-about">
${subNav}
${pageHeading(content.title)}
${content.bodyHtml}
</div>`;

	return renderPageShell({
		locale,
		pathname,
		title: `${content.title} | ${copy.siteName}`,
		origin,
		main,
		translationPending: content.translationPending,
		env,
		url,
	});
}
