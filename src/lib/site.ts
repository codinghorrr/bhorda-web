import type { Locale } from './i18n';
import { localizedPath } from './i18n';

export const SITE_NAME = 'Gayatri Kamdhenu Sevatirth';
export const SITE_NAME_GU = 'ગાયત્રી કામધેનુ સેવાતીર્થ';
export const SITE_ORIGIN = 'https://sevatirthbhorda.org';

export type SiteCopy = {
	siteName: string;
	tagline: string;
	newsletterHeading: string;
	newsletterPlaceholder: string;
	newsletterButton: string;
	newsletterHint: string;
	newsletterComingSoon: string;
	newsletterSuccess: string;
	newsletterAlready: string;
	newsletterError: string;
	contactHeading: string;
	contactSummary: string;
	switchTo: string;
	footerRights: string;
	notFoundTitle: string;
	notFoundBody: string;
	translationPending: string;
};

const COPY: Record<Locale, SiteCopy> = {
	en: {
		siteName: SITE_NAME,
		tagline: 'Bhorda — seva, sadhana, and community',
		newsletterHeading: 'Newsletter',
		newsletterPlaceholder: 'Your email address',
		newsletterButton: 'Subscribe',
		newsletterHint: 'Updates from Sevatirth Bhorda. No payment links.',
		newsletterComingSoon: 'Newsletter signup coming soon.',
		newsletterSuccess: 'Thank you — please check your email to confirm your subscription.',
		newsletterAlready: 'This email is already on our list.',
		newsletterError: 'We could not subscribe that address. Please try again later.',
		contactHeading: 'Visit & connect',
		contactSummary: 'Gayatri Kamdhenu Sevatirth, Bhorda, Gujarat',
		switchTo: 'ગુજરાતી',
		footerRights: '© Gayatri Kamdhenu Sevatirth. All rights reserved.',
		notFoundTitle: 'Page not found',
		notFoundBody: 'The page you requested is not available yet.',
		translationPending: 'Gujarati translation pending — showing English content.',
	},
	gu: {
		siteName: SITE_NAME_GU,
		tagline: 'ભોરડા — સેવા, સાધના અને સમુદાય',
		newsletterHeading: 'ન્યૂઝલેટર',
		newsletterPlaceholder: 'તમારું ઇમેઇલ સરનામું',
		newsletterButton: 'સબ્સ્ક્રાઇબ',
		newsletterHint: 'સેવાતીર્થ ભોરડાથી અપડેટ્સ. કોઈ ચુકવણી લિંક નહીં.',
		newsletterComingSoon: 'ન્યૂઝલેટર સબ્સ્ક્રિપ્શન ટૂંક સમયમાં ઉપલબ્ધ થશે.',
		newsletterSuccess: 'આભાર — કૃપા કરીને તમારું સબ્સ્ક્રિપ્શન પુષ્ટિ કરવા ઇમેઇલ તપાસો.',
		newsletterAlready: 'આ ઇમેઇલ પહેલેથી અમારી યાદીમાં છે.',
		newsletterError: 'આ સરનામું સબ્સ્ક્રાઇબ કરી શકાયું નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
		contactHeading: 'મુલાકાત અને સંપર્ક',
		contactSummary: 'ગાયત્રી કામધેનુ સેવાતીર્થ, ભોરડા, ગુજરાત',
		switchTo: 'English',
		footerRights: '© ગાયત્રી કામધેનુ સેવાતીર્થ. સર્વાધિકાર સુરક્ષિત.',
		notFoundTitle: 'પૃષ્ઠ મળ્યું નથી',
		notFoundBody: 'તમે વિનંતી કરેલ પૃષ્ઠ હજી ઉપલબ્ધ નથી.',
		translationPending: 'ગુજરાતી અનુવાદ બાકી છે — અંગ્રેજી સામગ્રી બતાવવામાં આવે છે.',
	},
};

export function siteCopy(locale: Locale): SiteCopy {
	return COPY[locale];
}

export function absoluteLocalizedUrl(origin: string, locale: Locale, pathname: string): string {
	const path = localizedPath(locale, pathname);
	return `${origin}${path}`;
}
