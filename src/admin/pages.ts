import type { AuthSession } from '../lib/auth';
import { escapeHtml } from '../lib/html';
import {
	canAccessSection,
	defaultLandingPath,
	navItemsForRole,
	sectionFromPath,
	type AdminSection,
} from './rbac';
import { adminHtmlResponse } from './security';
import {
	createSignedCsrfToken,
	renderAdminLayout,
	renderForbiddenPage,
	renderNavLinks,
	renderPlaceholderPage,
} from './templates';

const PAGE_COPY: Record<AdminSection, { title: string; description: string }> = {
	events: {
		title: 'Spotlight Events',
		description: 'Manage one-off dated events, festivals, shibirs, and katha programmes.',
	},
	schedule: {
		title: 'Regular Schedule',
		description: 'Maintain recurring weekly activities and their timings.',
	},
	gallery: {
		title: 'Gallery',
		description: 'Photo, audio, and video gallery entries will be managed here.',
	},
	stall: {
		title: 'Sahitya Stall',
		description: 'Catalog pickup-only stall items and stock availability.',
	},
	'page-text': {
		title: 'Page Text',
		description: 'Edit bilingual static content blocks across the public site.',
	},
	submissions: {
		title: 'Submissions Inbox',
		description: 'Review donation interest, seva requests, and other form submissions.',
	},
	users: {
		title: 'User Management',
		description: 'Invite and manage admin and manager accounts.',
	},
	settings: {
		title: 'Site Settings',
		description: 'Analytics snippets, Sendy reference, and security configuration.',
	},
	analytics: {
		title: 'Analytics Dashboard',
		description: 'Read-only visitor and engagement summaries.',
	},
};

export async function renderAdminSection(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response> {
	const section = sectionFromPath(pathname);
	if (!section) {
		return adminHtmlResponse('Not Found', { status: 404 });
	}

	if (!canAccessSection(session.role, section)) {
		const csrfToken = await createSignedCsrfToken(env);
		const nav = navItemsForRole(session.role);
		const html = renderAdminLayout({
			title: 'Access denied',
			activePath: pathname,
			email: session.email,
			role: session.role,
			navHtml: renderNavLinks(nav, pathname),
			content: renderForbiddenPage(),
			csrfToken,
		});
		return adminHtmlResponse(html, { status: 403 });
	}

	const copy = PAGE_COPY[section];
	const csrfToken = await createSignedCsrfToken(env);
	const nav = navItemsForRole(session.role);
	const html = renderAdminLayout({
		title: copy.title,
		activePath: pathname,
		email: session.email,
		role: session.role,
		navHtml: renderNavLinks(nav, pathname),
		content: renderPlaceholderPage(copy.title, copy.description),
		csrfToken,
	});
	return adminHtmlResponse(html);
}

export async function renderAdminHome(env: Env, session: AuthSession): Promise<Response> {
	const landing = defaultLandingPath(session.role);
	const csrfToken = await createSignedCsrfToken(env);
	const nav = navItemsForRole(session.role);
	const html = renderAdminLayout({
		title: 'Dashboard',
		activePath: '/vedmata',
		email: session.email,
		role: session.role,
		navHtml: renderNavLinks(nav, '/vedmata'),
		content: `<div class="admin-placeholder">
			<p class="admin-placeholder-lead">Signed in as <strong>${escapeHtml(session.role)}</strong>.</p>
			<p>Select a section from the sidebar to begin. Your landing page is <a href="${escapeHtml(landing)}">${escapeHtml(landing)}</a>.</p>
		</div>`,
		csrfToken,
	});
	return adminHtmlResponse(html);
}
