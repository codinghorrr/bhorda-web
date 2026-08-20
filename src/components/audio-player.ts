import { escapeHtml } from '../lib/html';

export type AudioPlayerTrack = {
	id: string;
	title: string;
	composer?: string | null;
	description?: string | null;
	fileUrl: string;
	lyricsGu?: string | null;
	lyricsTranslit?: string | null;
	downloadLabel?: string;
};

/** Public audio player: playback, download link, and static lyrics panel (no sync). */
export function renderAudioPlayer(track: AudioPlayerTrack): string {
	const downloadLabel = track.downloadLabel ?? 'Download';
	const composer = track.composer
		? `<p class="audio-player__composer">${escapeHtml(track.composer)}</p>`
		: '';
	const description = track.description
		? `<div class="audio-player__description">${escapeHtml(track.description)}</div>`
		: '';

	const lyricsGu = track.lyricsGu?.trim()
		? `<section class="audio-lyrics" aria-labelledby="lyrics-gu-${escapeHtml(track.id)}">
	<h3 class="audio-lyrics__heading" id="lyrics-gu-${escapeHtml(track.id)}">Lyrics (Gujarati)</h3>
	<div class="audio-lyrics__body audio-lyrics__body--gu">${formatLyrics(track.lyricsGu)}</div>
</section>`
		: '';

	const lyricsTranslit = track.lyricsTranslit?.trim()
		? `<section class="audio-lyrics" aria-labelledby="lyrics-tr-${escapeHtml(track.id)}">
	<h3 class="audio-lyrics__heading" id="lyrics-tr-${escapeHtml(track.id)}">Transliteration</h3>
	<div class="audio-lyrics__body">${formatLyrics(track.lyricsTranslit)}</div>
</section>`
		: '';

	const lyricsPanel =
		lyricsGu || lyricsTranslit
			? `<aside class="audio-player__lyrics" aria-label="Lyrics">
	${lyricsGu}
	${lyricsTranslit}
</aside>`
			: '';

	return `<div class="audio-player" data-track-id="${escapeHtml(track.id)}">
	<div class="audio-player__main">
		<h2 class="audio-player__title">${escapeHtml(track.title)}</h2>
		${composer}
		${description}
		<audio class="audio-player__element" controls preload="metadata" src="${escapeHtml(track.fileUrl)}">
			Your browser does not support audio playback.
		</audio>
		<p class="audio-player__actions">
			<a class="btn btn--gold audio-player__download" href="${escapeHtml(track.fileUrl)}" download>${escapeHtml(downloadLabel)}</a>
		</p>
	</div>
	${lyricsPanel}
</div>`;
}

function formatLyrics(text: string): string {
	return escapeHtml(text).replace(/\n/g, '<br />');
}
