import type { Locale } from './i18n';

/** English narrative — mirrors design-reference/Our_Story_Content.md */
const NARRATIVE_EN = [
	'For more than three decades, families across Gujarat have gathered under the banner of Gayatri Pariwar — turning spiritual ideals into daily seva, sadhana, and community upliftment. What began as a handful of prayer circles has grown into campuses of learning, yagya, and care that welcome seekers from every walk of life.',
	'It began at Amreshwar in 1990, where the first families committed themselves to Gayatri japa, swadhyay, and constructive programmes rooted in Gurudev Pandit Shriram Sharma Acharya\'s vision. The flame lit there would travel village to village, strengthening character and compassion long before any permanent ashram existed.',
	'By 1998, the movement found a stronger home in Dabhoi — a regional hub where yagya culture, youth programmes, and festival celebrations drew ever-larger crowds. Dabhoi remains a sister centre in spirit; many who serve at Bhorda today first discovered Gayatri Pariwar there.',
	'In 1999, the tradition of Pragya Puran Katha began — multi-day discourses that weave scripture, social reform, and practical sadhana into one living experience. Katha weeks still anchor the calendar, inviting families to pause, listen, and renew their sankalp together.',
	'2003 saw the establishment of Maa Bhagwati Pragya Bhavan, a dedicated space for women\'s leadership, cultural programmes, and values-based gatherings. 2006 brought Shri Ram Shraddha Bhavan, extending the campus footprint for larger yagyas, annakshetra, and collective celebrations.',
	'2016 marked the founding of the Gurukul — free residential education for tribal girls, blending academics with sanskar, yoga, and self-reliance training. Today more than sixty-four girls call the gurukul home, supported entirely through seva and sponsorship.',
	'2017 consecrated Shivalaya, anchoring daily temple rhythm — morning and evening aarti, meditation, and the quiet discipline that shapes every other programme on campus.',
	'In 2022, generous donors gifted the Bhorda land that would become Gayatri Kamdhenu Sevatirth — gaushala, gurukul expansion, and Mavtardham for dignified elder care, all on one consecrated campus.',
	'2023 witnessed the historic 108 Kundi Mahayagya at Bhorda — a week of collective havan that drew volunteers, seekers, and well-wishers from across the region and marked Sevatirth\'s arrival on the national Gayatri Pariwar map.',
	'Today, Sevatirth Bhorda is a living centre of seva: thirty mother cows in daily care, gurukul classrooms alive with learning, Mavtardham offering comfort to the elderly, and open doors for anyone who wishes to participate in yagya, tree planting, medical camps, or quiet sadhana. The story continues — written not in stone, but in the hands of every volunteer who serves.',
];

export type OurStoryStat = {
	value: string;
	label: { en: string; gu: string };
};

export const OUR_STORY_STATS: OurStoryStat[] = [
	{ value: '64+', label: { en: 'Girls in Gurukul', gu: 'ગુરુકુલમાં બાળકીઓ' } },
	{ value: '30+', label: { en: 'Mother cows', gu: 'માતા ગાયો' } },
	{ value: '35', label: { en: 'Kanya Kaushalya camps', gu: 'કન્યા કૌશલ્ય શિબિરો' } },
	{ value: '1990', label: { en: 'Founded', gu: 'સ્થાપના' } },
];

export type OurStoryMeta = {
	title: string;
	description: string;
	pageTitle: string;
	intro: string;
};

const META: Record<Locale, OurStoryMeta> = {
	en: {
		pageTitle: 'Our Story',
		title: 'Our Story | Gayatri Kamdhenu Sevatirth',
		description:
			'Four decades of Gayatri Pariwar seva — from Amreshwar to Sevatirth Bhorda. Read the full narrative and explore an interactive timeline of milestones.',
		intro: 'A journey of thirty-five years, told one blessing at a time.',
	},
	gu: {
		pageTitle: 'અમારી કથા',
		title: 'અમારી કથા | ગાયત્રી કામધેનુ સેવાતીર્થ',
		description:
			'ગાયત્રી પરિવારની ચાર દાયકાની સેવા — અમરેશ્વરથી સેવાતીર્થ ભોરડા સુધી. સંપૂર્ણ કથા અને માઇલસ્ટોનની ઇન્ટરએક્ટિવ સમયરેખા.',
		intro: 'સેવા, સાધના અને સમુદાયની જીવંત યાત્રા — અમરેશ્વરથી સેવાતીર્થ ભોરડા સુધી.',
	},
};

export function ourStoryMeta(locale: Locale): OurStoryMeta {
	return META[locale];
}

export function ourStoryNarrative(locale: Locale): { paragraphs: string[]; translationPending: boolean } {
	if (locale === 'gu') {
		return { paragraphs: NARRATIVE_EN, translationPending: true };
	}
	return { paragraphs: NARRATIVE_EN, translationPending: false };
}

export function ourStoryStatLabel(locale: Locale, stat: OurStoryStat): string {
	return locale === 'gu' && stat.label.gu ? stat.label.gu : stat.label.en;
}
