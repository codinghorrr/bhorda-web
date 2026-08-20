import type { AuthSession } from '../../lib/auth';
import { randomId } from '../../lib/crypto';
import { escapeHtml } from '../../lib/html';
import { processPhotoUpload } from '../../lib/images';
import { deleteObject, mediaKeyFromUrl, publicMediaUrl, putObject } from '../../lib/r2';
import { AUDIO_UPLOAD, PHOTO_UPLOAD, validateUpload } from '../../lib/uploads';
import { actions, alert, field, hidden, select } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

const GALLERY_PATH = '/vedmata/gallery';

const PHOTO_ACTIVITY_TAGS = [
	{ value: 'gaushala', label: 'Gaushala' },
	{ value: 'gurukul', label: 'Gurukul' },
	{ value: 'yagya', label: 'Yagya' },
	{ value: 'festival', label: 'Festival' },
	{ value: 'general', label: 'General' },
	{ value: 'other', label: 'Other' },
];

type PhotoRow = {
	id: string;
	url: string;
	activity_tag: string | null;
	event_id: string | null;
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
	playlist_id: string | null;
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
	event_id: string | null;
	day_number: number | null;
};

type PlaylistRow = {
	id: string;
	name_en: string;
	name_gu: string | null;
	type: string;
};

type EventOption = {
	id: string;
	title_en: string;
	date_start: string;
};

export async function handleGalleryRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith(GALLERY_PATH)) {
		return null;
	}

	if (pathname === GALLERY_PATH && request.method === 'GET') {
		return galleryHub(request, env, session);
	}

	if (pathname === `${GALLERY_PATH}/playlists` && request.method === 'POST') {
		return createPlaylist(request, env, session);
	}

	const photo = matchPhotoRoutes(pathname, request.method);
	if (photo) {
		return handlePhotoRoute(request, env, session, photo);
	}

	const audio = matchAudioRoutes(pathname, request.method);
	if (audio) {
		return handleAudioRoute(request, env, session, audio);
	}

	const video = matchVideoRoutes(pathname, request.method);
	if (video) {
		return handleVideoRoute(request, env, session, video);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

function matchPhotoRoutes(
	pathname: string,
	method: string,
): { action: 'list' | 'form' | 'save' | 'delete'; id: string | null } | null {
	const base = `${GALLERY_PATH}/photos`;
	if (pathname === base && method === 'GET') return { action: 'list', id: null };
	if (pathname === `${base}/new` && method === 'GET') return { action: 'form', id: null };
	if (pathname === base && method === 'POST') return { action: 'save', id: null };

	const edit = new RegExp(`^${base}/([^/]+)/edit$`).exec(pathname);
	if (edit && method === 'GET') return { action: 'form', id: edit[1]! };

	const update = new RegExp(`^${base}/([^/]+)$`).exec(pathname);
	if (update && method === 'POST') return { action: 'save', id: update[1]! };

	const del = new RegExp(`^${base}/([^/]+)/delete$`).exec(pathname);
	if (del && method === 'POST') return { action: 'delete', id: del[1]! };

	return null;
}

function matchAudioRoutes(
	pathname: string,
	method: string,
): { action: 'list' | 'form' | 'save' | 'delete'; id: string | null } | null {
	const base = `${GALLERY_PATH}/audio`;
	if (pathname === base && method === 'GET') return { action: 'list', id: null };
	if (pathname === `${base}/new` && method === 'GET') return { action: 'form', id: null };
	if (pathname === base && method === 'POST') return { action: 'save', id: null };

	const edit = new RegExp(`^${base}/([^/]+)/edit$`).exec(pathname);
	if (edit && method === 'GET') return { action: 'form', id: edit[1]! };

	const update = new RegExp(`^${base}/([^/]+)$`).exec(pathname);
	if (update && method === 'POST') return { action: 'save', id: update[1]! };

	const del = new RegExp(`^${base}/([^/]+)/delete$`).exec(pathname);
	if (del && method === 'POST') return { action: 'delete', id: del[1]! };

	return null;
}

function matchVideoRoutes(
	pathname: string,
	method: string,
): { action: 'list' | 'form' | 'save' | 'delete'; id: string | null } | null {
	const base = `${GALLERY_PATH}/videos`;
	if (pathname === base && method === 'GET') return { action: 'list', id: null };
	if (pathname === `${base}/new` && method === 'GET') return { action: 'form', id: null };
	if (pathname === base && method === 'POST') return { action: 'save', id: null };

	const edit = new RegExp(`^${base}/([^/]+)/edit$`).exec(pathname);
	if (edit && method === 'GET') return { action: 'form', id: edit[1]! };

	const update = new RegExp(`^${base}/([^/]+)$`).exec(pathname);
	if (update && method === 'POST') return { action: 'save', id: update[1]! };

	const del = new RegExp(`^${base}/([^/]+)/delete$`).exec(pathname);
	if (del && method === 'POST') return { action: 'delete', id: del[1]! };

	return null;
}

async function handlePhotoRoute(
	request: Request,
	env: Env,
	session: AuthSession,
	route: { action: 'list' | 'form' | 'save' | 'delete'; id: string | null },
): Promise<Response> {
	switch (route.action) {
		case 'list':
			return listPhotos(request, env, session);
		case 'form':
			return formPhoto(request, env, session, route.id);
		case 'save':
			return savePhoto(request, env, session, route.id);
		case 'delete':
			return deletePhoto(request, env, session, route.id!);
	}
}

async function handleAudioRoute(
	request: Request,
	env: Env,
	session: AuthSession,
	route: { action: 'list' | 'form' | 'save' | 'delete'; id: string | null },
): Promise<Response> {
	switch (route.action) {
		case 'list':
			return listAudio(request, env, session);
		case 'form':
			return formAudio(request, env, session, route.id);
		case 'save':
			return saveAudio(request, env, session, route.id);
		case 'delete':
			return deleteAudio(request, env, session, route.id!);
	}
}

async function handleVideoRoute(
	request: Request,
	env: Env,
	session: AuthSession,
	route: { action: 'list' | 'form' | 'save' | 'delete'; id: string | null },
): Promise<Response> {
	switch (route.action) {
		case 'list':
			return listVideos(request, env, session);
		case 'form':
			return formVideo(request, env, session, route.id);
		case 'save':
			return saveVideo(request, env, session, route.id);
		case 'delete':
			return deleteVideo(request, env, session, route.id!);
	}
}

async function galleryHub(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const content = `<p class="admin-placeholder-lead">Manage photo, audio, and video gallery content.</p>
<div class="admin-toolbar">
	<a class="btn btn--gold" href="${GALLERY_PATH}/photos">Photos</a>
	<a class="btn btn--gold" href="${GALLERY_PATH}/audio">Audio</a>
	<a class="btn btn--gold" href="${GALLERY_PATH}/videos">Videos</a>
</div>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Gallery',
		activePath: GALLERY_PATH,
		content,
	});
}

async function spotlightEventOptions(env: Env): Promise<{ value: string; label: string }[]> {
	const rows = await env.DB.prepare('SELECT id, title_en, date_start FROM spotlight_events ORDER BY date_start DESC').all<EventOption>();
	return [
		{ value: '', label: '(none)' },
		...(rows.results?.map((row) => ({ value: row.id, label: `${row.title_en} (${row.date_start})` })) ?? []),
	];
}

async function audioPlaylistOptions(env: Env): Promise<{ value: string; label: string }[]> {
	const rows = await env.DB.prepare("SELECT id, name_en FROM playlists WHERE type = 'audio' ORDER BY name_en").all<Pick<PlaylistRow, 'id' | 'name_en'>>();
	return [
		{ value: '', label: '(none)' },
		...(rows.results?.map((row) => ({ value: row.id, label: row.name_en })) ?? []),
	];
}

function audioExtension(mime: string): string {
	switch (mime) {
		case 'audio/mpeg':
			return 'mp3';
		case 'audio/mp4':
		case 'audio/x-m4a':
			return 'm4a';
		case 'audio/wav':
		case 'audio/x-wav':
			return 'wav';
		default:
			return 'bin';
	}
}

async function deleteMediaObject(env: Env, url: string | null): Promise<void> {
	if (!url) return;
	const key = mediaKeyFromUrl(url);
	if (key) {
		await deleteObject(env.MEDIA, key);
	}
}

// --- Photos ---

async function listPhotos(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare(
		`SELECT p.id, p.url, p.activity_tag, p.caption_en, p.event_id, e.title_en AS event_title
		 FROM gallery_photo p
		 LEFT JOIN spotlight_events e ON e.id = p.event_id
		 ORDER BY p.id DESC`,
	).all<PhotoRow & { event_title: string | null }>();

	const items =
		rows.results
			?.map(
				(row) => `<tr>
			<td><img src="${escapeHtml(row.url)}" alt="" width="80" height="60" style="object-fit:cover" /></td>
			<td>${escapeHtml(row.caption_en ?? '')}</td>
			<td><span class="admin-badge">${escapeHtml(row.activity_tag ?? '')}</span></td>
			<td>${escapeHtml(row.event_title ?? '')}</td>
			<td class="admin-table-actions"><a href="${GALLERY_PATH}/photos/${escapeHtml(row.id)}/edit">Edit</a></td>
		</tr>`,
			)
			.join('') ?? '';

	const content = `<div class="admin-toolbar">
	<a class="btn btn--gold" href="${GALLERY_PATH}">Gallery hub</a>
	<a class="btn btn--gold" href="${GALLERY_PATH}/photos/new">New photo</a>
</div>
<table class="admin-table">
	<thead><tr><th>Preview</th><th>Caption</th><th>Activity</th><th>Event</th><th></th></tr></thead>
	<tbody>${items || '<tr><td colspan="5">No photos yet.</td></tr>'}</tbody>
</table>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Gallery Photos',
		activePath: GALLERY_PATH,
		content,
	});
}

async function formPhoto(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: PhotoRow | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM gallery_photo WHERE id = ?').bind(id).first<PhotoRow>();
		if (!row) return adminRedirect(`${GALLERY_PATH}/photos`);
	}

	const eventOptions = await spotlightEventOptions(env);
	const action = id ? `${GALLERY_PATH}/photos/${id}` : `${GALLERY_PATH}/photos`;
	const content = `${alert('Uploaded photos are resized and saved as JPEG only. Original files are never stored.', 'info')}
<form class="admin-form admin-form--wide" method="post" action="${action}" enctype="multipart/form-data">
${hidden('csrf_token', csrf)}
${select('Activity tag', 'activity_tag', row?.activity_tag ?? 'general', PHOTO_ACTIVITY_TAGS)}
${select('Linked event (optional)', 'event_id', row?.event_id ?? '', eventOptions)}
${field('Caption (English)', 'caption_en', row?.caption_en ?? '')}
${field('Caption (Gujarati)', 'caption_gu', row?.caption_gu ?? '')}
<label class="admin-label" for="photo">${id ? 'Replace photo (optional)' : 'Photo'}</label>
<input class="admin-input" id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"${id ? '' : ' required'} />
${row?.url ? `<p class="admin-form-hint">Current: <a href="${escapeHtml(row.url)}" target="_blank" rel="noopener">view</a></p>` : ''}
${actions(id ? 'Update photo' : 'Upload photo')}
</form>
${id ? `<form method="post" action="${GALLERY_PATH}/photos/${escapeHtml(id)}/delete" onsubmit="return confirm('Delete this photo?')">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit photo' : 'New photo',
		activePath: GALLERY_PATH,
		content,
	});
}

async function savePhoto(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return renderAdminPage(request, env, {
			session,
			title: 'Gallery Photos',
			activePath: GALLERY_PATH,
			content: alert('Invalid CSRF token.', 'error'),
			status: 403,
		});
	}

	const activityTag = String(form.get('activity_tag') ?? 'general').trim();
	const eventId = String(form.get('event_id') ?? '').trim() || null;
	const captionEn = String(form.get('caption_en') ?? '').trim() || null;
	const captionGu = String(form.get('caption_gu') ?? '').trim() || null;

	const photoId = id ?? randomId('gph');
	let photoUrl: string | null = null;
	if (id) {
		const existing = await env.DB.prepare('SELECT url FROM gallery_photo WHERE id = ?').bind(id).first<{ url: string }>();
		photoUrl = existing?.url ?? null;
	}

	const photo = form.get('photo');
	if (photo instanceof File && photo.size > 0) {
		const err = validateUpload(photo, PHOTO_UPLOAD);
		if (err) {
			return renderAdminPage(request, env, {
				session,
				title: 'Gallery Photos',
				activePath: GALLERY_PATH,
				content: alert(err, 'error'),
			});
		}

		// IRREVERSIBLE: only processed JPEG is written to R2; the original upload is never stored.
		const processed = await processPhotoUpload(photo);
		const key = `photos/${photoId}.jpg`;
		if (id && photoUrl) {
			await deleteMediaObject(env, photoUrl);
		}
		await putObject(env.MEDIA, key, processed.data, processed.contentType);
		photoUrl = publicMediaUrl(key);
	} else if (!id) {
		return renderAdminPage(request, env, {
			session,
			title: 'Gallery Photos',
			activePath: GALLERY_PATH,
			content: alert('A photo file is required.', 'error'),
		});
	}

	if (!photoUrl) {
		return formPhoto(request, env, session, id);
	}

	if (id) {
		await env.DB.prepare(
			'UPDATE gallery_photo SET url=?, activity_tag=?, event_id=?, caption_en=?, caption_gu=? WHERE id=?',
		)
			.bind(photoUrl, activityTag, eventId, captionEn, captionGu, id)
			.run();
	} else {
		await env.DB.prepare(
			'INSERT INTO gallery_photo (id, url, activity_tag, event_id, caption_en, caption_gu) VALUES (?, ?, ?, ?, ?, ?)',
		)
			.bind(photoId, photoUrl, activityTag, eventId, captionEn, captionGu)
			.run();
	}

	return adminRedirect(`${GALLERY_PATH}/photos`);
}

async function deletePhoto(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const existing = await env.DB.prepare('SELECT url FROM gallery_photo WHERE id = ?').bind(id).first<{ url: string }>();
	await deleteMediaObject(env, existing?.url ?? null);
	await env.DB.prepare('DELETE FROM gallery_photo WHERE id = ?').bind(id).run();
	return adminRedirect(`${GALLERY_PATH}/photos`);
}

// --- Audio ---

async function listAudio(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const csrf = await getCsrfToken(env);
	const [tracks, playlists] = await Promise.all([
		env.DB.prepare(
			`SELECT a.id, a.title_en, a.composer, a.playlist_id, p.name_en AS playlist_name
			 FROM gallery_audio a
			 LEFT JOIN playlists p ON p.id = a.playlist_id
			 ORDER BY a.title_en`,
		).all<Pick<AudioRow, 'id' | 'title_en' | 'composer' | 'playlist_id'> & { playlist_name: string | null }>(),
		env.DB.prepare("SELECT id, name_en, name_gu FROM playlists WHERE type = 'audio' ORDER BY name_en").all<PlaylistRow>(),
	]);

	const trackRows =
		tracks.results
			?.map(
				(row) => `<tr>
			<td>${escapeHtml(row.title_en)}</td>
			<td>${escapeHtml(row.composer ?? '')}</td>
			<td>${escapeHtml(row.playlist_name ?? '')}</td>
			<td class="admin-table-actions"><a href="${GALLERY_PATH}/audio/${escapeHtml(row.id)}/edit">Edit</a></td>
		</tr>`,
			)
			.join('') ?? '';

	const playlistRows =
		playlists.results
			?.map(
				(row) => `<tr>
			<td>${escapeHtml(row.name_en)}</td>
			<td>${escapeHtml(row.name_gu ?? '')}</td>
		</tr>`,
			)
			.join('') ?? '';

	const content = `<div class="admin-toolbar">
	<a class="btn btn--gold" href="${GALLERY_PATH}">Gallery hub</a>
	<a class="btn btn--gold" href="${GALLERY_PATH}/audio/new">New audio</a>
</div>
<h2 class="admin-subheading">Tracks</h2>
<table class="admin-table">
	<thead><tr><th>Title</th><th>Composer</th><th>Playlist</th><th></th></tr></thead>
	<tbody>${trackRows || '<tr><td colspan="4">No audio tracks yet.</td></tr>'}</tbody>
</table>
<h2 class="admin-subheading">Audio playlists</h2>
<form class="admin-form" method="post" action="${GALLERY_PATH}/playlists">
${hidden('csrf_token', csrf)}
${field('Playlist name (English)', 'name_en', '', { required: true })}
${field('Playlist name (Gujarati)', 'name_gu', '')}
${actions('Create playlist')}
</form>
<table class="admin-table">
	<thead><tr><th>Name (English)</th><th>Name (Gujarati)</th></tr></thead>
	<tbody>${playlistRows || '<tr><td colspan="2">No playlists yet.</td></tr>'}</tbody>
</table>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Gallery Audio',
		activePath: GALLERY_PATH,
		content,
	});
}

async function formAudio(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: AudioRow | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM gallery_audio WHERE id = ?').bind(id).first<AudioRow>();
		if (!row) return adminRedirect(`${GALLERY_PATH}/audio`);
	}

	const playlistOptions = await audioPlaylistOptions(env);
	const action = id ? `${GALLERY_PATH}/audio/${id}` : `${GALLERY_PATH}/audio`;
	const content = `<form class="admin-form admin-form--wide" method="post" action="${action}" enctype="multipart/form-data">
${hidden('csrf_token', csrf)}
${field('Title (English)', 'title_en', row?.title_en ?? '', { required: true })}
${field('Title (Gujarati)', 'title_gu', row?.title_gu ?? '')}
${field('Composer', 'composer', row?.composer ?? '')}
${field('Description (English)', 'desc_en', row?.desc_en ?? '', { type: 'textarea' })}
${field('Description (Gujarati)', 'desc_gu', row?.desc_gu ?? '', { type: 'textarea' })}
${select('Playlist', 'playlist_id', row?.playlist_id ?? '', playlistOptions)}
${field('Lyrics (Gujarati)', 'lyrics_gu', row?.lyrics_gu ?? '', { type: 'textarea', rows: 8 })}
${field('Lyrics (transliteration)', 'lyrics_translit', row?.lyrics_translit ?? '', { type: 'textarea', rows: 8 })}
<label class="admin-label" for="audio">${id ? 'Replace audio file (optional)' : 'Audio file'}</label>
<input class="admin-input" id="audio" name="audio" type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav"${id ? '' : ' required'} />
${row?.file_url ? `<p class="admin-form-hint">Current: <a href="${escapeHtml(row.file_url)}" target="_blank" rel="noopener">listen</a></p>` : ''}
${actions(id ? 'Update audio' : 'Upload audio')}
</form>
${id ? `<form method="post" action="${GALLERY_PATH}/audio/${escapeHtml(id)}/delete" onsubmit="return confirm('Delete this audio track?')">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit audio' : 'New audio',
		activePath: GALLERY_PATH,
		content,
	});
}

async function saveAudio(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const titleEn = String(form.get('title_en') ?? '').trim();
	const titleGu = String(form.get('title_gu') ?? '').trim() || null;
	const composer = String(form.get('composer') ?? '').trim() || null;
	const descEn = String(form.get('desc_en') ?? '').trim() || null;
	const descGu = String(form.get('desc_gu') ?? '').trim() || null;
	const playlistId = String(form.get('playlist_id') ?? '').trim() || null;
	const lyricsGu = String(form.get('lyrics_gu') ?? '').trim() || null;
	const lyricsTranslit = String(form.get('lyrics_translit') ?? '').trim() || null;

	if (!titleEn) {
		return formAudio(request, env, session, id);
	}

	const audioId = id ?? randomId('gau');
	let fileUrl: string | null = null;
	if (id) {
		const existing = await env.DB.prepare('SELECT file_url FROM gallery_audio WHERE id = ?').bind(id).first<{ file_url: string }>();
		fileUrl = existing?.file_url ?? null;
	}

	const audio = form.get('audio');
	if (audio instanceof File && audio.size > 0) {
		const err = validateUpload(audio, AUDIO_UPLOAD);
		if (err) {
			return renderAdminPage(request, env, {
				session,
				title: 'Gallery Audio',
				activePath: GALLERY_PATH,
				content: alert(err, 'error'),
			});
		}

		const ext = audioExtension(audio.type);
		const key = `audio/${audioId}.${ext}`;
		if (id && fileUrl) {
			await deleteMediaObject(env, fileUrl);
		}
		await putObject(env.MEDIA, key, await audio.arrayBuffer(), audio.type);
		fileUrl = publicMediaUrl(key);
	} else if (!id) {
		return renderAdminPage(request, env, {
			session,
			title: 'Gallery Audio',
			activePath: GALLERY_PATH,
			content: alert('An audio file is required.', 'error'),
		});
	}

	if (!fileUrl) {
		return formAudio(request, env, session, id);
	}

	if (id) {
		await env.DB.prepare(
			`UPDATE gallery_audio SET file_url=?, title_en=?, title_gu=?, composer=?, desc_en=?, desc_gu=?, playlist_id=?, lyrics_gu=?, lyrics_translit=? WHERE id=?`,
		)
			.bind(fileUrl, titleEn, titleGu, composer, descEn, descGu, playlistId, lyricsGu, lyricsTranslit, id)
			.run();
	} else {
		await env.DB.prepare(
			`INSERT INTO gallery_audio (id, file_url, title_en, title_gu, composer, desc_en, desc_gu, playlist_id, lyrics_gu, lyrics_translit)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(audioId, fileUrl, titleEn, titleGu, composer, descEn, descGu, playlistId, lyricsGu, lyricsTranslit)
			.run();
	}

	return adminRedirect(`${GALLERY_PATH}/audio`);
}

async function deleteAudio(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const existing = await env.DB.prepare('SELECT file_url FROM gallery_audio WHERE id = ?').bind(id).first<{ file_url: string }>();
	await deleteMediaObject(env, existing?.file_url ?? null);
	await env.DB.prepare('DELETE FROM gallery_audio WHERE id = ?').bind(id).run();
	return adminRedirect(`${GALLERY_PATH}/audio`);
}

async function createPlaylist(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const nameEn = String(form.get('name_en') ?? '').trim();
	const nameGu = String(form.get('name_gu') ?? '').trim() || null;
	if (!nameEn) {
		return listAudio(request, env, session);
	}

	const playlistId = randomId('pls');
	await env.DB.prepare('INSERT INTO playlists (id, name_en, name_gu, type) VALUES (?, ?, ?, ?)')
		.bind(playlistId, nameEn, nameGu, 'audio')
		.run();

	return adminRedirect(`${GALLERY_PATH}/audio`);
}

// --- Videos ---

async function listVideos(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare(
		`SELECT v.id, v.title_en, v.youtube_url, v.day_number, v.event_id, e.title_en AS event_title
		 FROM gallery_video v
		 LEFT JOIN spotlight_events e ON e.id = v.event_id
		 ORDER BY v.title_en`,
	).all<Pick<VideoRow, 'id' | 'title_en' | 'youtube_url' | 'day_number' | 'event_id'> & { event_title: string | null }>();

	const items =
		rows.results
			?.map(
				(row) => `<tr>
			<td>${escapeHtml(row.title_en)}</td>
			<td><a href="${escapeHtml(row.youtube_url)}" target="_blank" rel="noopener">YouTube</a></td>
			<td>${escapeHtml(row.event_title ?? '')}</td>
			<td>${row.day_number != null ? escapeHtml(String(row.day_number)) : ''}</td>
			<td class="admin-table-actions"><a href="${GALLERY_PATH}/videos/${escapeHtml(row.id)}/edit">Edit</a></td>
		</tr>`,
			)
			.join('') ?? '';

	const content = `<div class="admin-toolbar">
	<a class="btn btn--gold" href="${GALLERY_PATH}">Gallery hub</a>
	<a class="btn btn--gold" href="${GALLERY_PATH}/videos/new">New video</a>
</div>
<table class="admin-table">
	<thead><tr><th>Title</th><th>YouTube</th><th>Event</th><th>Katha day</th><th></th></tr></thead>
	<tbody>${items || '<tr><td colspan="5">No videos yet.</td></tr>'}</tbody>
</table>`;

	return renderAdminPage(request, env, {
		session,
		title: 'Gallery Videos',
		activePath: GALLERY_PATH,
		content,
	});
}

async function formVideo(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: VideoRow | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM gallery_video WHERE id = ?').bind(id).first<VideoRow>();
		if (!row) return adminRedirect(`${GALLERY_PATH}/videos`);
	}

	const eventOptions = await spotlightEventOptions(env);
	const action = id ? `${GALLERY_PATH}/videos/${id}` : `${GALLERY_PATH}/videos`;
	const content = `${alert('Videos are linked by YouTube URL. No file upload is required.', 'info')}
<form class="admin-form admin-form--wide" method="post" action="${action}">
${hidden('csrf_token', csrf)}
${field('YouTube URL', 'youtube_url', row?.youtube_url ?? '', { required: true, placeholder: 'https://www.youtube.com/watch?v=...' })}
${field('Thumbnail URL', 'thumbnail_url', row?.thumbnail_url ?? '', { placeholder: 'https://...' })}
${field('Title (English)', 'title_en', row?.title_en ?? '', { required: true })}
${field('Title (Gujarati)', 'title_gu', row?.title_gu ?? '')}
${field('Description (English)', 'desc_en', row?.desc_en ?? '', { type: 'textarea' })}
${field('Description (Gujarati)', 'desc_gu', row?.desc_gu ?? '', { type: 'textarea' })}
${select('Linked event (optional)', 'event_id', row?.event_id ?? '', eventOptions)}
${field('Katha day number (optional)', 'day_number', row?.day_number != null ? String(row.day_number) : '', { type: 'number', placeholder: '1' })}
${actions(id ? 'Update video' : 'Create video')}
</form>
${id ? `<form method="post" action="${GALLERY_PATH}/videos/${escapeHtml(id)}/delete" onsubmit="return confirm('Delete this video?')">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit video' : 'New video',
		activePath: GALLERY_PATH,
		content,
	});
}

async function saveVideo(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const youtubeUrl = String(form.get('youtube_url') ?? '').trim();
	const thumbnailUrl = String(form.get('thumbnail_url') ?? '').trim() || null;
	const titleEn = String(form.get('title_en') ?? '').trim();
	const titleGu = String(form.get('title_gu') ?? '').trim() || null;
	const descEn = String(form.get('desc_en') ?? '').trim() || null;
	const descGu = String(form.get('desc_gu') ?? '').trim() || null;
	const eventId = String(form.get('event_id') ?? '').trim() || null;
	const dayRaw = String(form.get('day_number') ?? '').trim();
	const dayNumber = dayRaw ? Number(dayRaw) : null;

	if (!youtubeUrl || !titleEn) {
		return formVideo(request, env, session, id);
	}

	const videoId = id ?? randomId('gvi');
	if (id) {
		await env.DB.prepare(
			`UPDATE gallery_video SET youtube_url=?, thumbnail_url=?, title_en=?, title_gu=?, desc_en=?, desc_gu=?, event_id=?, day_number=? WHERE id=?`,
		)
			.bind(youtubeUrl, thumbnailUrl, titleEn, titleGu, descEn, descGu, eventId, dayNumber, id)
			.run();
	} else {
		await env.DB.prepare(
			`INSERT INTO gallery_video (id, youtube_url, thumbnail_url, title_en, title_gu, desc_en, desc_gu, event_id, day_number)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(videoId, youtubeUrl, thumbnailUrl, titleEn, titleGu, descEn, descGu, eventId, dayNumber)
			.run();
	}

	return adminRedirect(`${GALLERY_PATH}/videos`);
}

async function deleteVideo(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	await env.DB.prepare('DELETE FROM gallery_video WHERE id = ?').bind(id).run();
	return adminRedirect(`${GALLERY_PATH}/videos`);
}
