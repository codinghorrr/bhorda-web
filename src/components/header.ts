import type { Locale } from '../lib/i18n';
import { alternateLocale, localizedPath } from '../lib/i18n';
import { isNavActive, navHref, PRIMARY_NAV } from '../lib/nav';
import { siteCopy, SITE_LOGO_LOCKUP } from '../lib/site';
import { escapeHtml } from '../lib/html';

export type HeaderOptions = {
	locale: Locale;
	pathname: string;
	newsletterAvailable?: boolean;
	newsletterNotice?: string | null;
};

export function renderHeader({
	locale,
	pathname,
	newsletterAvailable = false,
	newsletterNotice = null,
}: HeaderOptions): string {
	const copy = siteCopy(locale);
	const otherLocale = alternateLocale(locale);
	const switchHref = localizedPath(otherLocale, pathname);
	const homeHref = navHref(locale, '/');

	const navItems = PRIMARY_NAV.map((item) => {
		const href = navHref(locale, item.path);
		const active = isNavActive(pathname, item.path);
		const classes = active ? 'nav-link is-active' : 'nav-link';
		return `<li><a class="${classes}" href="${escapeHtml(href)}"${active ? ' aria-current="page"' : ''}>${escapeHtml(item.labels[locale])}</a></li>`;
	}).join('');

	const notice = newsletterNotice
		? `<p class="newsletter-notice" role="status">${escapeHtml(newsletterNotice)}</p>`
		: '';

	return `<header class="site-header">
	<div class="container header-inner">
		<a class="brand" href="${escapeHtml(homeHref)}" aria-label="${escapeHtml(copy.siteName)}">
			<img
				class="brand-lockup"
				src="${SITE_LOGO_LOCKUP}"
				alt=""
				width="133"
				height="40"
				decoding="async"
			/>
		</a>
		<nav class="primary-nav" aria-label="${locale === 'gu' ? 'મુખ્ય નેવિગેશન' : 'Primary'}">
			<ul class="nav-list">${navItems}</ul>
		</nav>
		<div class="header-tools">
			<a class="lang-switch" href="${escapeHtml(switchHref)}" hreflang="${otherLocale}" lang="${otherLocale}">${escapeHtml(copy.switchTo)}</a>
			${notice}
			${renderNewsletterForm(locale, 'header', newsletterAvailable)}
		</div>
	</div>
</header>`;
}

export function renderNewsletterForm(locale: Locale, variant: 'header' | 'footer', available = false): string {
	const copy = siteCopy(locale);

	if (!available) {
		return `<p class="newsletter-coming-soon">${escapeHtml(copy.newsletterComingSoon)}</p>`;
	}

	const action = '/api/newsletter/subscribe';
	const idPrefix = variant === 'header' ? 'header' : 'footer';

	return `<form class="newsletter-form newsletter-form--${variant}" action="${action}" method="post">
		<label class="visually-hidden" for="${idPrefix}-newsletter-email">${escapeHtml(copy.newsletterHeading)}</label>
		<input
			id="${idPrefix}-newsletter-email"
			class="newsletter-input"
			type="email"
			name="email"
			required
			autocomplete="email"
			placeholder="${escapeHtml(copy.newsletterPlaceholder)}"
		/>
		<input type="hidden" name="locale" value="${locale}" />
		<button class="btn btn--gold newsletter-submit" type="submit">${escapeHtml(copy.newsletterButton)}</button>
	</form>`;
}
