import { renderAudioPlayer } from '../../components/audio-player';
import { renderPageShell } from '../../components/layout';
import type { Locale } from '../../lib/i18n';
import { localizedPath } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';
import { uiCopy } from '../../lib/ui-copy';
import { PHOTO_ACTIVITY_TAGS } from '../../lib/site-structure';
import { siteCopy } from '../../lib/site';

type PhotoRow = {
	id: string;
	url: string;
	activity_tag: string | null;
	caption_en: string | null;
	caption_gu: string | null;
};

type AudioRow = {
	id: string;
	file_url: string;
	title_en: string;
	title_gu: string | null;
	composer: string | null;
	desc_en: string | null;
	desc_gu: string | null;
	lyrics_gu: string | null;
	lyrics_translit: string | null;
};

type VideoRow = {
	id: string;
	youtube_url: string;
	thumbnail_url: string | null;
	title_en: string;
	title_gu: string | null;
	desc_en: string | null;
	desc_gu: string | null;
};

function pickTitle(row: { title_en: string; title_gu: string | null }, locale: Locale): string {
	return locale === 'gu' && row.title_gu ? row.title_gu : row.title_en;
}

function galleryNav(locale: Locale, pathname: string): string {
	const base = localizedPath(locale, '/gallery');
	const items = [
		{ path: '/gallery', label: locale === 'gu' ? 'ગેલેરી' : 'Overview' },
		{ path: '/gallery/photos', label: locale === 'gu' ? 'ફોટા' : 'Photos' },
		{ path: '/gallery/audio', label: locale === 'gu' ? 'ઑડિયો' : 'Audio' },
		{ path: '/gallery/videos', label: locale === 'gu' ? 'વિડિયો' : 'Videos' },
	];
	const links = items
		.map((item) => {
			const href = localizedPath(locale, item.path);
			const active = pathname === item.path;
			return `<a class="subnav__link${active ? ' is-active' : ''}" href="${escapeHtml(href)}"${active ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`;
		})
		.join('');
	return `<nav class="subnav" aria-label="Gallery">${links}</nav>`;
}

export async function renderGalleryHub(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const copy = siteCopy(locale);
	const base = localizedPath(locale, '/gallery');
	const main = `<div class="container page-gallery">
<h1 class="page-title">${locale === 'gu' ? 'ગેલેરી' : 'Gallery'}</h1>
${galleryNav(locale, '/gallery')}
<div class="card-grid">
	<a class="card card--link" href="${escapeHtml(`${base}/photos`)}"><h2 class="card-title">${locale === 'gu' ? 'ફોટા' : 'Photos'}</h2><p>${locale === 'gu' ? 'પ્રવૃત્તિ દ્વારા ફિલ્ટર કરો' : 'Filter by activity'}</p></a>
	<a class="card card--link" href="${escapeHtml(`${base}/audio`)}"><h2 class="card-title">${locale === 'gu' ? 'ઑડિયો' : 'Audio'}</h2><p>${locale === 'gu' ? 'પ્લેયર અને ગીતો' : 'Player and lyrics'}</p></a>
	<a class="card card--link" href="${escapeHtml(`${base}/videos`)}"><h2 class="card-title">${locale === 'gu' ? 'વિડિયો' : 'Videos'}</h2><p>YouTube</p></a>
</div>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/gallery',
		title: `${locale === 'gu' ? 'ગેલેરી' : 'Gallery'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderGalleryPhotos(
	env: Env,
	locale: Locale,
	origin: string,
	filterTag: string,
	url: URL,
): Promise<string> {
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const query = filterTag
		? env.DB.prepare('SELECT * FROM gallery_photo WHERE activity_tag = ? ORDER BY id DESC').bind(filterTag)
		: env.DB.prepare('SELECT * FROM gallery_photo ORDER BY id DESC');
	const rows = await query.all<PhotoRow>();

	const filters = PHOTO_ACTIVITY_TAGS.map((tag) => {
		const href = tag.value
			? `${localizedPath(locale, '/gallery/photos')}?activity=${encodeURIComponent(tag.value)}`
			: localizedPath(locale, '/gallery/photos');
		const active = tag.value === filterTag;
		return `<a class="filter-chip${active ? ' is-active' : ''}" href="${escapeHtml(href)}">${escapeHtml(tag.label[locale])}</a>`;
	}).join('');

	const grid =
		rows.results
			?.map((row) => {
				const cap = locale === 'gu' && row.caption_gu ? row.caption_gu : row.caption_en ?? '';
				return `<figure class="photo-card">
			<img src="${escapeHtml(row.url)}" alt="${escapeHtml(cap)}" loading="lazy" />
			${cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''}
			${row.activity_tag ? `<span class="badge">${escapeHtml(row.activity_tag)}</span>` : ''}
		</figure>`;
			})
			.join('') ?? '';

	const main = `<div class="container page-gallery">
${galleryNav(locale, '/gallery/photos')}
<h1 class="page-title">${locale === 'gu' ? 'ફોટો ગેલેરી' : 'Photo gallery'}</h1>
<div class="filter-bar">${filters}</div>
<div class="photo-grid">${grid || `<p class="empty-state">${locale === 'gu' ? 'હજી કોઈ ફોટો નથી.' : 'No photos yet.'}</p>`}</div>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/gallery/photos',
		title: `${locale === 'gu' ? 'ફોટા' : 'Photos'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderGalleryAudioIndex(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const rows = await env.DB.prepare('SELECT * FROM gallery_audio ORDER BY title_en').all<AudioRow>();

	const items =
		rows.results
			?.map((row) => {
				const title = pickTitle(row, locale);
				const href = localizedPath(locale, `/gallery/audio/${row.id}`);
				return `<li class="audio-index__item">
			<a class="audio-index__link" href="${escapeHtml(href)}">${escapeHtml(title)}</a>
			${row.composer ? `<span class="audio-index__composer">${escapeHtml(row.composer)}</span>` : ''}
		</li>`;
			})
			.join('') ?? '';

	const main = `<div class="container page-gallery">
${galleryNav(locale, '/gallery/audio')}
<h1 class="page-title">${locale === 'gu' ? 'ઑડિયો ગેલેરી' : 'Audio gallery'}</h1>
${items ? `<ul class="audio-index">${items}</ul>` : `<p class="empty-state">${locale === 'gu' ? 'હજી કોઈ ઑડિયો નથી.' : 'No audio tracks yet.'}</p>`}
</div>`;

	return renderPageShell({
		locale,
		pathname: '/gallery/audio',
		title: `${locale === 'gu' ? 'ઑડિયો' : 'Audio'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderGalleryAudioTrack(
	env: Env,
	locale: Locale,
	origin: string,
	trackId: string,
	url: URL,
): Promise<string | null> {
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const row = await env.DB.prepare('SELECT * FROM gallery_audio WHERE id = ?').bind(trackId).first<AudioRow>();
	if (!row) return null;

	const title = pickTitle(row, locale);
	const desc = locale === 'gu' && row.desc_gu ? row.desc_gu : row.desc_en;
	const player = renderAudioPlayer({
		id: row.id,
		title,
		composer: row.composer,
		description: desc,
		fileUrl: row.file_url,
		lyricsGu: row.lyrics_gu,
		lyricsTranslit: row.lyrics_translit,
		downloadLabel: ui.download,
	});

	const main = `<div class="container page-gallery">
${galleryNav(locale, '/gallery/audio')}
<p class="page-back"><a href="${escapeHtml(localizedPath(locale, '/gallery/audio'))}">← ${escapeHtml(ui.backTo)} ${locale === 'gu' ? 'ઑડિયો' : 'Audio'}</a></p>
${player}
</div>`;

	return renderPageShell({
		locale,
		pathname: `/gallery/audio/${trackId}`,
		title: `${title} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}

export async function renderGalleryVideos(env: Env, locale: Locale, origin: string, url: URL): Promise<string> {
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const rows = await env.DB.prepare('SELECT * FROM gallery_video ORDER BY title_en').all<VideoRow>();

	const grid =
		rows.results
			?.map((row) => {
				const title = pickTitle(row, locale);
				const desc = locale === 'gu' && row.desc_gu ? row.desc_gu : row.desc_en ?? '';
				const thumb = row.thumbnail_url
					? `<img class="video-card__thumb" src="${escapeHtml(row.thumbnail_url)}" alt="" loading="lazy" />`
					: '<div class="video-card__thumb-placeholder"></div>';
				return `<article class="video-card video-card--grid">
			<a href="${escapeHtml(row.youtube_url)}" target="_blank" rel="noopener noreferrer">
				${thumb}
				<h2 class="video-card__title">${escapeHtml(title)}</h2>
				${desc ? `<p class="video-card__desc">${escapeHtml(desc.slice(0, 100))}</p>` : ''}
				<span class="video-card__cta">${escapeHtml(ui.viewOnYoutube)}</span>
			</a>
		</article>`;
			})
			.join('') ?? '';

	const main = `<div class="container page-gallery">
${galleryNav(locale, '/gallery/videos')}
<h1 class="page-title">${locale === 'gu' ? 'વિડિયો ગેલેરી' : 'Video gallery'}</h1>
<p class="lead">${locale === 'gu' ? 'વિડિયો YouTube પર ખુલે છે — અહીં એમ્બેડ નથી.' : 'Videos open on YouTube in a new tab — not embedded here.'}</p>
<div class="video-grid">${grid || `<p class="empty-state">${locale === 'gu' ? 'હજી કોઈ વિડિયો નથી.' : 'No videos yet.'}</p>`}</div>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/gallery/videos',
		title: `${locale === 'gu' ? 'વિડિયો' : 'Videos'} | ${copy.siteName}`,
		origin,
		main,
		env,
		url,
	});
}
