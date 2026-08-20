import type { Locale } from './i18n';

export type UiCopy = {
	submit: string;
	submitted: string;
	name: string;
	email: string;
	phone: string;
	message: string;
	donationType: string;
	occasionDate: string;
	occasionType: string;
	contactUs: string;
	download: string;
	viewOnYoutube: string;
	noPhotos: string;
	noVideos: string;
	noMedia: string;
	upcoming: string;
	past: string;
	regularSchedule: string;
	spotlightEvents: string;
	filterAll: string;
	readMore: string;
	backTo: string;
	stats: string;
	photos: string;
	donationInterest: string;
	sanskarRequest: string;
	activityConnect: string;
};

const COPY: Record<Locale, UiCopy> = {
	en: {
		submit: 'Submit',
		submitted: 'Thank you — your message has been received. Our team will respond soon.',
		name: 'Full name',
		email: 'Email',
		phone: 'Phone',
		message: 'Message',
		donationType: 'Donation type',
		occasionDate: 'Occasion date',
		occasionType: 'Occasion type',
		contactUs: 'Contact us',
		download: 'Download',
		viewOnYoutube: 'Watch on YouTube',
		noPhotos: 'No photos linked to this event yet.',
		noVideos: 'No videos linked to this event yet.',
		noMedia: 'No gallery media linked to this event yet.',
		upcoming: 'Upcoming',
		past: 'Past events',
		regularSchedule: 'Regular weekly schedule',
		spotlightEvents: 'Spotlight events',
		filterAll: 'All activities',
		readMore: 'Learn more',
		backTo: 'Back to',
		stats: 'At a glance',
		photos: 'Photos',
		donationInterest: 'Express donation interest',
		sanskarRequest: 'Contact us to perform this Sanskar',
		activityConnect: 'Connect with us about this activity',
	},
	gu: {
		submit: 'સબમિટ કરો',
		submitted: 'આભાર — તમારો સંદેશ મળ્યો છે. અમારી ટીમ ટૂંક સમયમાં જવાબ આપશે.',
		name: 'પૂરું નામ',
		email: 'ઇમેઇલ',
		phone: 'ફોન',
		message: 'સંદેશ',
		donationType: 'દાન પ્રકાર',
		occasionDate: 'પ્રસંગની તારીખ',
		occasionType: 'પ્રસંગનો પ્રકાર',
		contactUs: 'અમારો સંપર્ક કરો',
		download: 'ડાઉનલોડ',
		viewOnYoutube: 'YouTube પર જુઓ',
		noPhotos: 'આ કાર્યક્રમ સાથે હજી કોઈ ફોટો જોડાયેલ નથી.',
		noVideos: 'આ કાર્યક્રમ સાથે હજી કોઈ વિડિયો જોડાયેલ નથી.',
		noMedia: 'આ કાર્યક્રમ સાથે હજી કોઈ ગેલેરી મીડિયા જોડાયેલ નથી.',
		upcoming: 'આગામી',
		past: 'ભૂતકાળના કાર્યક્રમો',
		regularSchedule: 'નિયમિત સાપ્તાહિક સમયપત્રક',
		spotlightEvents: 'સ્પોટલાઇટ કાર્યક્રમો',
		filterAll: 'બધી પ્રવૃત્તિઓ',
		readMore: 'વધુ જાણો',
		backTo: 'પાછા',
		stats: 'એક નજરમાં',
		photos: 'ફોટા',
		donationInterest: 'દાનમાં રુચિ વ્યક્ત કરો',
		sanskarRequest: 'આ સંસ્કાર કરાવવા અમારો સંપર્ક કરો',
		activityConnect: 'આ પ્રવૃત્તિ વિશે અમારો સંપર્ક કરો',
	},
};

export function uiCopy(locale: Locale): UiCopy {
	return COPY[locale];
}
