import type { Locale } from './i18n';
import { localizedPath } from './i18n';

export type NavItem = {
	key: string;
	path: string;
	labels: Record<Locale, string>;
};

/** Primary navigation from PRD §5 Information Architecture. */
export const PRIMARY_NAV: readonly NavItem[] = [
	{ key: 'home', path: '/', labels: { en: 'Home', gu: 'હોમ' } },
	{ key: 'about', path: '/about', labels: { en: 'About', gu: 'વિશે' } },
	{ key: 'events', path: '/events', labels: { en: 'Events', gu: 'કાર્યક્રમો' } },
	{ key: 'gallery', path: '/gallery', labels: { en: 'Gallery', gu: 'ગેલેરી' } },
	{ key: 'activities', path: '/activities', labels: { en: 'Activities', gu: 'પ્રવૃત્તિઓ' } },
	{
		key: 'learn',
		path: '/learn',
		labels: { en: 'Learn & Resources', gu: 'શીખો અને સંસાધનો' },
	},
	{
		key: 'contact',
		path: '/contact',
		labels: { en: 'Contact / Donation', gu: 'સંપર્ક / દાન' },
	},
	{ key: 'gaushala', path: '/gaushala', labels: { en: 'Gaushala', gu: 'ગૌશાળા' } },
	{ key: 'gurukul', path: '/gurukul', labels: { en: 'Gurukul', gu: 'ગુરુકુલ' } },
] as const;

export function navHref(locale: Locale, path: string): string {
	return localizedPath(locale, path);
}

export function isNavActive(pathname: string, itemPath: string): boolean {
	if (itemPath === '/') {
		return pathname === '/';
	}
	return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}
