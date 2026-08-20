import { renderAudioPlayer } from '../../components/audio-player';
import { renderPageShell } from '../../components/layout';
import type { Locale } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';

type AudioRow = {
	id: string;
	file_url: string;
	title_en: string;
	title_gu: string | null;
	composer: string | null;
	desc_en: string | null;
	desc_gu: string | null;
	playlist_id: string | null;
	lyrics_gu: string | null;
	lyrics_translit: string | null;
};

type PlaylistRow = {
	id: string;
	name_en: string;
	name_gu: string | null;
};

const COPY = {
	en: {
		pageTitle: 'Audio Gallery',
		trackTitle: (title: string) => title,
		backToGallery: '← All audio',
		noTracks: 'No audio tracks are available yet.',
		download: 'Download',
		playlist: 'Playlist',
	},
	gu: {
		pageTitle: 'ઑડિયો ગેલેરી',
		trackTitle: (title: string) => title,
		backToGallery: '← બધા ઑડિયો',
		noTracks: 'હજી કોઈ ઑડિયો ટ્રેક ઉપલબ્ધ નથી.',
		download: 'ડાઉનલોડ',
		playlist: 'પ્લેલિસ્ટ',
	},
} as const;

function pickTitle(row: AudioRow, locale: Locale): string {
	if (locale === 'gu' && row.title_gu?.trim()) {
		return row.title_gu;
	}
	return row.title_en;
}

function pickDescription(row: AudioRow, locale: Locale): string | null {
	if (locale === 'gu' && row.desc_gu?.trim()) {
		return row.desc_gu;
	}
	return row.desc_en;
}

function pickPlaylistName(row: PlaylistRow, locale: Locale): string {
	if (locale === 'gu' && row.name_gu?.trim()) {
		return row.name_gu;
	}
	return row.name_en;
}

export async function renderGalleryAudioIndex(env: Env, locale: Locale, origin: string): Promise<string> {
	const copy = COPY[locale];
	const [tracks, playlists] = await Promise.all([
		env.DB.prepare('SELECT * FROM gallery_audio ORDER BY title_en').all<AudioRow>(),
		env.DB.prepare("SELECT id, name_en, name_gu FROM playlists WHERE type = 'audio' ORDER BY name_en").all<PlaylistRow>(),
	]);

	const playlistNames = new Map(
		(playlists.results ?? []).map((p) => [p.id, pickPlaylistName(p, locale)]),
	);

	const items =
		tracks.results
			?.map((row) => {
				const title = pickTitle(row, locale);
				const playlist = row.playlist_id ? playlistNames.get(row.playlist_id) : null;
				const playlistHtml = playlist
					? `<span class="audio-index__playlist">${escapeHtml(copy.playlist)}: ${escapeHtml(playlist)}</span>`
					: '';
				return `<li class="audio-index__item">
			<a class="audio-index__link" href="/${locale}/gallery/audio/${escapeHtml(row.id)}">${escapeHtml(title)}</a>
			${row.composer ? `<span class="audio-index__composer">${escapeHtml(row.composer)}</span>` : ''}
			${playlistHtml}
		</li>`;
			})
			.join('') ?? '';

	const main = `<div class="container page-gallery-audio">
	<h1 class="page-title">${escapeHtml(copy.pageTitle)}</h1>
	${items ? `<ul class="audio-index">${items}</ul>` : `<p class="lead">${escapeHtml(copy.noTracks)}</p>`}
</div>`;

	return renderPageShell({
		locale,
		pathname: '/gallery/audio',
		title: copy.pageTitle,
		origin,
		main,
	});
}

export async function renderGalleryAudioTrack(
	env: Env,
	locale: Locale,
	origin: string,
	trackId: string,
): Promise<string | null> {
	const copy = COPY[locale];
	const row = await env.DB.prepare('SELECT * FROM gallery_audio WHERE id = ?').bind(trackId).first<AudioRow>();
	if (!row) {
		return null;
	}

	const title = pickTitle(row, locale);
	const player = renderAudioPlayer({
		id: row.id,
		title,
		composer: row.composer,
		description: pickDescription(row, locale),
		fileUrl: row.file_url,
		lyricsGu: row.lyrics_gu,
		lyricsTranslit: row.lyrics_translit,
		downloadLabel: copy.download,
	});

	const main = `<div class="container page-gallery-audio">
	<p class="page-back"><a href="/${locale}/gallery/audio">${escapeHtml(copy.backToGallery)}</a></p>
	${player}
</div>`;

	return renderPageShell({
		locale,
		pathname: `/gallery/audio/${trackId}`,
		title: copy.trackTitle(title),
		origin,
		main,
	});
}
