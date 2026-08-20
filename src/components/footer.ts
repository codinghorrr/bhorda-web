import type { Locale } from '../lib/i18n';
import { alternateLocale, localizedPath } from '../lib/i18n';
import { siteCopy } from '../lib/site';
import { escapeHtml } from '../lib/html';
import { renderNewsletterForm } from './header';

export type FooterOptions = {
	locale: Locale;
	pathname: string;
	newsletterAvailable?: boolean;
	newsletterNotice?: string | null;
};

export function renderFooter({
	locale,
	pathname,
	newsletterAvailable = false,
	newsletterNotice = null,
}: FooterOptions): string {
	const copy = siteCopy(locale);
	const otherLocale = alternateLocale(locale);
	const switchHref = localizedPath(otherLocale, pathname);

	const notice = newsletterNotice
		? `<p class="newsletter-notice" role="status">${escapeHtml(newsletterNotice)}</p>`
		: '';

	return `<footer class="site-footer">
	<div class="container footer-grid">
		<div class="footer-block">
			<h2 class="footer-heading">${escapeHtml(copy.contactHeading)}</h2>
			<p class="footer-text">${escapeHtml(copy.contactSummary)}</p>
			<p class="footer-text footer-socials">
				<a href="https://www.awgp.org/" rel="noopener noreferrer">AWGP.org</a>
				<span class="footer-sep" aria-hidden="true">·</span>
				<a href="https://www.shantikunj.org/" rel="noopener noreferrer">Shantikunj</a>
			</p>
		</div>
		<div class="footer-block">
			<h2 class="footer-heading">${escapeHtml(copy.newsletterHeading)}</h2>
			<p class="footer-text">${escapeHtml(copy.newsletterHint)}</p>
			${notice}
			${renderNewsletterForm(locale, 'footer', newsletterAvailable)}
		</div>
		<div class="footer-block footer-block--lang">
			<h2 class="footer-heading">${locale === 'gu' ? 'ભાષા' : 'Language'}</h2>
			<a class="lang-switch lang-switch--footer" href="${escapeHtml(switchHref)}" hreflang="${otherLocale}" lang="${otherLocale}">${escapeHtml(copy.switchTo)}</a>
		</div>
	</div>
	<div class="container footer-bottom">
		<p class="footer-rights">${escapeHtml(copy.footerRights)}</p>
	</div>
</footer>`;
}
