import type { Locale } from '../lib/i18n';
import { renderAboutPage } from './pages/about';
import { renderActivitiesHub, renderActivityDetail, renderSanskarDetail, renderSanskarasIndex } from './pages/activities';
import { renderContactPage } from './pages/contact';
import {
	renderGalleryAudioIndex,
	renderGalleryAudioTrack,
	renderGalleryHub,
	renderGalleryPhotos,
	renderGalleryVideos,
} from './pages/gallery';
import { renderEventDetail, renderEventsPage } from './pages/events';
import { renderLearnDownloads, renderLearnHub, renderLearnLinks, renderLearnReading } from './pages/learn';
import { renderGaushalaPage, renderGurukulPage } from './pages/sections';

export async function renderPublicPage(
	env: Env,
	locale: Locale,
	pathname: string,
	origin: string,
	url: URL,
): Promise<string | null> {
	if (pathname === '/about' || pathname.startsWith('/about/')) {
		return renderAboutPage(env, locale, pathname, origin);
	}

	if (pathname === '/events') {
		return renderEventsPage(env, locale, origin);
	}

	const eventMatch = /^\/events\/([^/]+)$/.exec(pathname);
	if (eventMatch) {
		return renderEventDetail(env, locale, eventMatch[1]!, origin);
	}

	if (pathname === '/gallery') {
		return renderGalleryHub(env, locale, origin);
	}
	if (pathname === '/gallery/photos') {
		return renderGalleryPhotos(env, locale, origin, url.searchParams.get('activity')?.trim() ?? '');
	}
	if (pathname === '/gallery/audio') {
		return renderGalleryAudioIndex(env, locale, origin);
	}
	const audioMatch = /^\/gallery\/audio\/([^/]+)$/.exec(pathname);
	if (audioMatch) {
		return renderGalleryAudioTrack(env, locale, origin, audioMatch[1]!);
	}
	if (pathname === '/gallery/videos') {
		return renderGalleryVideos(env, locale, origin);
	}

	if (pathname === '/activities') {
		return renderActivitiesHub(env, locale, origin);
	}
	if (pathname === '/activities/sanskaras') {
		return renderSanskarasIndex(env, locale, origin);
	}
	const sanskarMatch = /^\/activities\/sanskaras\/([^/]+)$/.exec(pathname);
	if (sanskarMatch) {
		return renderSanskarDetail(env, locale, sanskarMatch[1]!, origin, url);
	}
	const activityMatch = /^\/activities\/([^/]+)$/.exec(pathname);
	if (activityMatch && activityMatch[1] !== 'sanskaras') {
		return renderActivityDetail(env, locale, activityMatch[1]!, origin, url);
	}

	if (pathname === '/learn') {
		return renderLearnHub(env, locale, origin);
	}
	if (pathname === '/learn/downloads') {
		return renderLearnDownloads(env, locale, origin);
	}
	if (pathname === '/learn/reading') {
		return renderLearnReading(env, locale, origin);
	}
	if (pathname === '/learn/links') {
		return renderLearnLinks(env, locale, origin);
	}

	if (pathname === '/contact') {
		return renderContactPage(env, locale, origin, url);
	}

	if (pathname === '/gaushala') {
		return renderGaushalaPage(env, locale, origin, url);
	}

	if (pathname === '/gurukul') {
		return renderGurukulPage(env, locale, origin, url);
	}

	return null;
}
