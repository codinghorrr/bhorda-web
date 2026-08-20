import type { Locale } from '../../lib/i18n';
import { getPageTexts } from '../../lib/content';
import { escapeHtml } from '../../lib/html';
import { siteCopy } from '../../lib/site';
import { renderPageShell } from '../../components/layout';

const HOME_BLOCKS = [
	'hero_title',
	'hero_lead',
	'highlight_gaushala',
	'highlight_gurukul',
	'highlight_mavtardham',
	'updates_teaser',
	'connect_cta',
] as const;

type HomeFallback = {
	hero_title: string;
	hero_lead: string;
	highlight_gaushala: { title: string; body: string };
	highlight_gurukul: { title: string; body: string };
	highlight_mavtardham: { title: string; body: string };
	updates_teaser: string;
	connect_cta: { title: string; body: string; button: string };
};

const FALLBACK: Record<Locale, HomeFallback> = {
	en: {
		hero_title: 'Welcome to Gayatri Kamdhenu Sevatirth',
		hero_lead:
			'A living centre of seva, sadhana, and Gayatri Pariwar values in Bhorda — welcoming families, seekers, and volunteers.',
		highlight_gaushala: {
			title: 'Gaushala',
			body: 'Cow seva, organic care, and Gau Seva opportunities for the community.',
		},
		highlight_gurukul: {
			title: 'Gurukul',
			body: 'Values-based learning for children and youth rooted in Indian culture.',
		},
		highlight_mavtardham: {
			title: 'Mavtardham',
			body: 'A sacred space for remembrance, prayer, and quiet reflection.',
		},
		updates_teaser: 'Spotlight events, regular schedule, and gallery highlights will appear here as content is published.',
		connect_cta: {
			title: 'Connect with us',
			body: 'Share your interest in seva, visits, donations, or volunteering — our team will respond personally.',
			button: 'Contact & donation interest',
		},
	},
	gu: {
		hero_title: 'ગાયત્રી કામધેનુ સેવાતીર્થમાં આપનું સ્વાગત છે',
		hero_lead:
			'ભોરડામાં સેવા, સાધના અને ગાયત્રી પરિવારના મૂલ્યોનું જીવંત કેન્દ્ર — પરિવારો, સાધકો અને સ્વયંસેવકોને આવકારે છે.',
		highlight_gaushala: {
			title: 'ગૌશાળા',
			body: 'ગૌ સેવા, જૈવિક સંભાળ અને સમુદાય માટે ગૌ સેવાના અવસર.',
		},
		highlight_gurukul: {
			title: 'ગુરુકુલ',
			body: 'ભારતીય સંસ્કૃતિમાં રૂટેડ બાળકો અને યુવાનો માટે મૂલ્ય આધારિત શિક્ષણ.',
		},
		highlight_mavtardham: {
			title: 'માવતર્ધામ',
			body: 'સ્મરણ, પ્રાર્થના અને શાંત ચિંતન માટે પવિત્ર સ્થાન.',
		},
		updates_teaser: 'સ્પોટલાઇટ કાર્યક્રમો, નિયમિત સમયપત્રક અને ગેલેરી હાઇલાઇટ્સ સામગ્રી પ્રકાશિત થતાં અહીં દેખાશે.',
		connect_cta: {
			title: 'અમારી સાથે જોડાઓ',
			body: 'સેવા, મુલાકાત, દાન અથવા સ્વયંસેવામાં તમારી રુચિ શેર કરો — અમારી ટીમ વ્યક્તિગત રીતે જવાબ આપશે.',
			button: 'સંપર્ક અને દાન રુચિ',
		},
	},
};

function pickText(
	blocks: Awaited<ReturnType<typeof getPageTexts>>,
	key: string,
	fallback: string,
): { text: string; pending: boolean } {
	const block = blocks[key];
	if (block?.text) {
		return { text: block.text, pending: block.translationPending };
	}
	return { text: fallback, pending: false };
}

export async function renderHomePage(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const fb = FALLBACK[locale];
	const blocks = await getPageTexts(env.DB, 'home', HOME_BLOCKS, locale);

	const heroTitle = pickText(blocks, 'hero_title', fb.hero_title);
	const heroLead = pickText(blocks, 'hero_lead', fb.hero_lead);
	const gaushala = pickText(blocks, 'highlight_gaushala', fb.highlight_gaushala.body);
	const gurukul = pickText(blocks, 'highlight_gurukul', fb.highlight_gurukul.body);
	const mavtardham = pickText(blocks, 'highlight_mavtardham', fb.highlight_mavtardham.body);
	const updates = pickText(blocks, 'updates_teaser', fb.updates_teaser);
	const connect = pickText(blocks, 'connect_cta', fb.connect_cta.body);

	const translationPending = [
		heroTitle,
		heroLead,
		gaushala,
		gurukul,
		mavtardham,
		updates,
		connect,
	].some((item) => item.pending);

	const contactHref = `/${locale}/contact`;

	const main = `<section class="hero" aria-labelledby="home-hero-title">
	<div class="container hero-inner">
		<p class="hero-om" aria-hidden="true">ॐ</p>
		<h1 id="home-hero-title" class="hero-title">${escapeHtml(heroTitle.text)}</h1>
		<span class="hero-rule" aria-hidden="true"></span>
		<p class="hero-lead">${escapeHtml(heroLead.text)}</p>
	</div>
</section>

<p class="highlights-band" aria-hidden="true">${locale === 'gu' ? 'ગૌશાળા · ગુરુકુલ · માવતર્ધામ · ભોરડા, ગુજરાત' : 'Gaushala · Gurukul · Mavtardham · Bhorda, Gujarat'}</p>

<section class="section highlights" aria-labelledby="home-highlights-title">
	<div class="container">
		<h2 id="home-highlights-title" class="section-title">${locale === 'gu' ? 'મુખ્ય કેન્દ્રો' : 'Highlights'}</h2>
		<div class="card-grid">
			<article class="card">
				<div class="card-icon" aria-hidden="true"></div>
				<h3 class="card-title">${escapeHtml(fb.highlight_gaushala.title)}</h3>
				<p>${escapeHtml(gaushala.text)}</p>
				<span class="card-tag">${locale === 'gu' ? 'સ્થા. ૨૦૨૨' : 'Est. 2022'}</span>
			</article>
			<article class="card">
				<div class="card-icon" aria-hidden="true"></div>
				<h3 class="card-title">${escapeHtml(fb.highlight_gurukul.title)}</h3>
				<p>${escapeHtml(gurukul.text)}</p>
				<span class="card-tag">${locale === 'gu' ? 'સ્થા. ૨૦૧૬' : 'Est. 2016'}</span>
			</article>
			<article class="card">
				<div class="card-icon" aria-hidden="true"></div>
				<h3 class="card-title">${escapeHtml(fb.highlight_mavtardham.title)}</h3>
				<p>${escapeHtml(mavtardham.text)}</p>
				<span class="card-tag">${locale === 'gu' ? 'સ્થા. ૨૦૨૨' : 'Est. 2022'}</span>
			</article>
		</div>
	</div>
</section>

<section class="section updates" aria-labelledby="home-updates-title">
	<div class="container">
		<h2 id="home-updates-title" class="section-title">${locale === 'gu' ? 'તાજા અપડેટ્સ' : 'Latest updates'}</h2>
		<p class="updates-teaser">${escapeHtml(updates.text)}</p>
	</div>
</section>

<section class="section cta" aria-labelledby="home-cta-title">
	<div class="container cta-panel">
		<h2 id="home-cta-title" class="cta-title">${escapeHtml(fb.connect_cta.title)}</h2>
		<p class="cta-body">${escapeHtml(connect.text)}</p>
		<a class="btn btn--gold" href="${escapeHtml(contactHref)}">${escapeHtml(fb.connect_cta.button)}</a>
	</div>
</section>`;

	return renderPageShell({
		locale,
		pathname: '/',
		title: `${copy.siteName} | ${locale === 'gu' ? 'હોમ' : 'Home'}`,
		origin,
		main,
		translationPending,
		env,
		url,
	});
}
