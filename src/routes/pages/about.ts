import { renderPageShell } from '../../components/layout';
import { renderPublicForm, renderSubNav, renderTimeline, type TimelineEvent } from '../../components/public-page';
import type { Locale } from '../../lib/i18n';
import { localizedPath } from '../../lib/i18n';
import { getPageText } from '../../lib/content';
import { escapeHtml } from '../../lib/html';
import { loadPageContent, pickLocalized, submittedFromUrl, pageHeading } from '../../lib/page-helpers';
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

async function loadTimeline(db: D1Database, locale: Locale): Promise<TimelineEvent[]> {
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

	return (
		rows.results?.map((row) => ({
			id: row.id,
			year: row.year,
			title: locale === 'gu' && row.title_gu ? row.title_gu : row.title_en,
			description: locale === 'gu' && row.desc_gu ? row.desc_gu : row.desc_en ?? '',
			imageUrl: row.image_url,
		})) ?? []
	);
}

export async function renderAboutPage(
	env: Env,
	locale: Locale,
	pathname: string,
	origin: string,
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
		});
	}

	if (pathname === '/about/our-story') {
		const fb = ABOUT_FALLBACK['about-our-story'][locale];
		const content = await loadPageContent(env.DB, locale, {
			pageKey: 'about-our-story',
			fallbackTitle: fb.title,
			fallbackBody: fb.body,
		});
		const timeline = await loadTimeline(env.DB, locale);

		const main = `<div class="container page-about">
${subNav}
${pageHeading(content.title, content.bodyHtml.replace(/<[^>]+>/g, '').slice(0, 120))}
${renderTimeline(timeline, locale)}
</div>`;

		return renderPageShell({
			locale,
			pathname,
			title: `${content.title} | ${copy.siteName}`,
			origin,
			main,
			translationPending: content.translationPending,
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
	});
}
