import type { UserRole } from '../lib/types';

export type AdminSection =
	| 'events'
	| 'schedule'
	| 'gallery'
	| 'stall'
	| 'page-text'
	| 'submissions'
	| 'users'
	| 'settings'
	| 'analytics';

export type AdminNavItem = {
	section: AdminSection;
	path: string;
	label: string;
};

const ROLE_SECTIONS: Record<UserRole, readonly AdminSection[]> = {
	manager: ['events', 'schedule', 'gallery', 'submissions'],
	admin: ['events', 'schedule', 'gallery', 'submissions', 'stall', 'page-text', 'analytics'],
	superadmin: ['events', 'schedule', 'gallery', 'submissions', 'stall', 'page-text', 'analytics', 'users', 'settings'],
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
	{ section: 'events', path: '/vedmata/events', label: 'Spotlight Events' },
	{ section: 'schedule', path: '/vedmata/schedule', label: 'Regular Schedule' },
	{ section: 'gallery', path: '/vedmata/gallery', label: 'Gallery' },
	{ section: 'stall', path: '/vedmata/stall', label: 'Sahitya Stall' },
	{ section: 'page-text', path: '/vedmata/page-text', label: 'Page Text' },
	{ section: 'submissions', path: '/vedmata/submissions', label: 'Submissions Inbox' },
	{ section: 'analytics', path: '/vedmata/analytics', label: 'Analytics Dashboard' },
	{ section: 'users', path: '/vedmata/users', label: 'User Management' },
	{ section: 'settings', path: '/vedmata/settings', label: 'Site Settings' },
] as const;

export function canAccessSection(role: UserRole, section: AdminSection): boolean {
	return ROLE_SECTIONS[role].includes(section);
}

export function navItemsForRole(role: UserRole): AdminNavItem[] {
	return ADMIN_NAV.filter((item) => canAccessSection(role, item.section));
}

export function sectionFromPath(pathname: string): AdminSection | null {
	const match = ADMIN_NAV.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
	return match?.section ?? null;
}

export function defaultLandingPath(role: UserRole): string {
	const items = navItemsForRole(role);
	return items[0]?.path ?? '/vedmata/events';
}
