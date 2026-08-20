import { renderPageShell } from '../../components/layout';
import { renderPublicForm } from '../../components/public-page';
import type { Locale } from '../../lib/i18n';
import { escapeHtml } from '../../lib/html';
import { getPageText } from '../../lib/content';
import { loadPageContent, pickLocalized, submittedFromUrl, pageHeading } from '../../lib/page-helpers';
import { DONATION_TYPES, OCCASION_TYPES } from '../../lib/site-structure';
import { uiCopy } from '../../lib/ui-copy';
import { siteCopy } from '../../lib/site';

const CONTACT_FALLBACK: Record<Locale, { title: string; body: string; address: string; phone: string; email: string }> = {
	en: {
		title: 'Contact & Donation',
		body: 'Reach out for visits, seva, and donation interest. We do not process online payments — our team will contact you personally.',
		address: 'Gayatri Kamdhenu Sevatirth, Bhorda, Gujarat, India',
		phone: '+91 (contact via form)',
		email: 'info@sevatirthbhorda.org',
	},
	gu: {
		title: 'સંપર્ક અને દાન',
		body: 'મુલાકાત, સેવા અને દાનમાં રુચિ માટે સંપર્ક કરો. અમે ઓનલાઇન ચુકવણી સ્વીકારતા નથી — અમારી ટીમ વ્યક્તિગત રીતે સંપર્ક કરશે.',
		address: 'ગાયત્રી કામધેનુ સેવાતીર્થ, ભોરડા, ગુજરાત, ભારત',
		phone: '+91 (ફોર્મ દ્વારા સંપર્ક)',
		email: 'info@sevatirthbhorda.org',
	},
};

export async function renderContactPage(
	env: Env,
	locale: Locale,
	origin: string,
	url: URL,
): Promise<string> {
	const ui = uiCopy(locale);
	const copy = siteCopy(locale);
	const fb = CONTACT_FALLBACK[locale];

	const content = await loadPageContent(env.DB, locale, {
		pageKey: 'contact',
		fallbackTitle: fb.title,
		fallbackBody: fb.body,
	});

	const address = (await getPageText(env.DB, 'contact', 'address', locale)).text || fb.address;
	const phone = (await getPageText(env.DB, 'contact', 'phone', locale)).text || fb.phone;
	const email = (await getPageText(env.DB, 'contact', 'email', locale)).text || fb.email;

	const donationOptions = DONATION_TYPES.map((t) => ({
		value: t.value,
		label: pickLocalized(locale, t.label),
	}));

	const occasionOptions = OCCASION_TYPES.map((t) => ({
		value: t.value,
		label: pickLocalized(locale, t.label),
	}));

	const form = renderPublicForm({
		formType: 'donation_general',
		locale,
		title: ui.donationInterest,
		submitted: submittedFromUrl(url),
		fields: [
			{
				type: 'select',
				name: 'donation_type',
				label: ui.donationType,
				required: true,
				options: donationOptions,
			},
			{
				type: 'select',
				name: 'occasion_type',
				label: ui.occasionType,
				options: [{ value: '', label: '—' }, ...occasionOptions],
			},
			{ type: 'date', name: 'occasion_date', label: ui.occasionDate },
			{ type: 'text', name: 'name', label: ui.name, required: true },
			{ type: 'email', name: 'email', label: ui.email, required: true },
			{ type: 'tel', name: 'phone', label: ui.phone },
			{ type: 'textarea', name: 'message', label: ui.message, rows: 5 },
		],
	});

	const main = `<div class="container page-contact">
${pageHeading(content.title, content.bodyHtml.replace(/<[^>]+>/g, '').slice(0, 200))}
<div class="contact-details card">
	<h2 class="section-title">${locale === 'gu' ? 'સંપર્ક વિગતો' : 'Contact details'}</h2>
	<p><strong>${locale === 'gu' ? 'સરનામું' : 'Address'}:</strong> ${escapeHtml(address)}</p>
	<p><strong>${locale === 'gu' ? 'ફોન' : 'Phone'}:</strong> ${escapeHtml(phone)}</p>
	<p><strong>${locale === 'gu' ? 'ઇમેઇલ' : 'Email'}:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
</div>
<section class="section">
${form}
</section>
<p class="form-note muted">${locale === 'gu' ? 'વર્ષગાંઠ / જન્મદિવસ / પુણ્યતિથિ માટેની રિક્વેસ્ટ માટે અમારી ટીમને યાદદાસ્ત મોકલવામાં આવશે.' : 'Anniversary / Birthday / Punyatithi requests schedule an internal staff reminder a few days before the date.'}</p>
</div>`;

	return renderPageShell({
		locale,
		pathname: '/contact',
		title: `${content.title} | ${copy.siteName}`,
		origin,
		main,
		translationPending: content.translationPending,
	});
}
