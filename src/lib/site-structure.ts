/** Site structure constants from PRD §5. */

export type AboutPage = {
	slug: string;
	pageKey: string;
	labels: { en: string; gu: string };
};

export const ABOUT_PAGES: readonly AboutPage[] = [
	{ slug: 'our-story', pageKey: 'about-our-story', labels: { en: 'Our Story', gu: 'અમારી કથા' } },
	{
		slug: 'pandit-shriram-sharma-acharya',
		pageKey: 'about-pandit-shriram',
		labels: { en: 'Pandit Shriram Sharma Acharya', gu: 'પંડિત શ્રીરામ શર્મા આચાર્ય' },
	},
	{
		slug: 'mata-bhagwati-devi-sharma',
		pageKey: 'about-mata-bhagwati',
		labels: { en: 'Vandaniya Mata Bhagwati Devi Sharma', gu: 'વંદનીય માતા ભગવતી દેવી શર્મા' },
	},
	{ slug: 'vedmata-gayatri', pageKey: 'about-vedmata-gayatri', labels: { en: 'Vedmata Gayatri', gu: 'વેદમાતા ગાયત્રી' } },
	{
		slug: 'all-world-gayatri-pariwar',
		pageKey: 'about-awgp',
		labels: { en: 'All World Gayatri Pariwar', gu: 'ઓલ વર્લ્ડ ગાયત્રી પરિવાર' },
	},
	{
		slug: 'present-mentor-dr-chinmay-pandya',
		pageKey: 'about-dr-chinmay',
		labels: { en: 'Present Mentor — Dr. Chinmay Pandya', gu: 'વર્તમાન માર્ગદર્શક — ડૉ. ચિન્મય પંડ્યા' },
	},
	{ slug: 'mission-vision', pageKey: 'about-mission-vision', labels: { en: 'Mission & Vision', gu: 'મિશન અને વિઝન' } },
	{
		slug: 'gayatri-pariwar-dabhoi',
		pageKey: 'about-dabhoi',
		labels: { en: 'Gayatri Pariwar Dabhoi', gu: 'ગાયત્રી પરિવાર દાભોઇ' },
	},
] as const;

export type ActivityPage = {
	slug: string;
	pageKey: string;
	labels: { en: string; gu: string };
	formType: string;
};

export const ACTIVITY_PAGES: readonly ActivityPage[] = [
	{ slug: 'yagya', pageKey: 'activity-yagya', labels: { en: 'Yagya', gu: 'યજ્ઞ' }, formType: 'activity_connect' },
	{ slug: 'zhola-pustakalay', pageKey: 'activity-zhola', labels: { en: 'Zhola Pustakalay', gu: 'ઝોળા પુસ્તકાલય' }, formType: 'activity_connect' },
	{ slug: 'tree-planting', pageKey: 'activity-trees', labels: { en: 'Tree Planting', gu: 'વૃક્ષારોપણ' }, formType: 'activity_connect' },
	{ slug: 'sadhana', pageKey: 'activity-sadhana', labels: { en: 'Sadhana', gu: 'સાધના' }, formType: 'activity_connect' },
	{
		slug: 'daily-routine-aarti',
		pageKey: 'activity-daily-routine',
		labels: { en: 'Daily Routine / Aarti', gu: 'દૈનિક દિનચર્યા / આરતી' },
		formType: 'activity_connect',
	},
	{ slug: 'swadhyay', pageKey: 'activity-swadhyay', labels: { en: 'Swadhyay', gu: 'સ્વાધ્યાય' }, formType: 'activity_connect' },
	{
		slug: 'festival-celebrations',
		pageKey: 'activity-festivals',
		labels: { en: 'Festival Celebrations', gu: 'ઉત્સવ ઉજવણી' },
		formType: 'activity_connect',
	},
	{
		slug: 'organic-farming',
		pageKey: 'activity-farming',
		labels: { en: 'Organic Farming', gu: 'જૈવિક ખેતી' },
		formType: 'activity_connect',
	},
	{
		slug: 'vaccination-medical-camps',
		pageKey: 'activity-medical',
		labels: { en: 'Vaccination & Medical Camps', gu: 'રસીકરણ અને મેડિકલ કેમ્પ' },
		formType: 'activity_connect',
	},
	{
		slug: 'bal-sanskar-shala',
		pageKey: 'activity-bal-sanskar',
		labels: { en: 'Bal Sanskar Shala', gu: 'બાલ સંસ્કાર શાળા' },
		formType: 'activity_connect',
	},
	{ slug: 'youth-cell', pageKey: 'activity-youth', labels: { en: 'Youth Cell', gu: 'યુવા કોષ' }, formType: 'activity_connect' },
	{
		slug: 'self-reliance-training',
		pageKey: 'activity-self-reliance',
		labels: { en: 'Self-Reliance Training', gu: 'સ્વાવલંબન તાલીમ' },
		formType: 'activity_connect',
	},
	{
		slug: 'games-annual-celebration',
		pageKey: 'activity-games',
		labels: { en: 'Games / Annual Celebration', gu: 'રમતગમત / વાર્ષિક ઉત્સવ' },
		formType: 'activity_connect',
	},
] as const;

export type SanskarPage = {
	slug: string;
	pageKey: string;
	labels: { en: string; gu: string };
	timingKey: string;
};

export const SANSKAR_PAGES: readonly SanskarPage[] = [
	{ slug: 'garbhadhan', pageKey: 'sanskar-garbhadhan', labels: { en: 'Garbhadhan', gu: 'ગર્ભાધાન' }, timingKey: 'timing' },
	{ slug: 'punsavan', pageKey: 'sanskar-punsavan', labels: { en: 'Punsavan', gu: 'પુંસવન' }, timingKey: 'timing' },
	{ slug: 'simantonayan', pageKey: 'sanskar-simantonayan', labels: { en: 'Simantonayan', gu: 'સીમંતોનયન' }, timingKey: 'timing' },
	{ slug: 'jatakarma', pageKey: 'sanskar-jatakarma', labels: { en: 'Jatakarma', gu: 'જાતકર્મ' }, timingKey: 'timing' },
	{ slug: 'namakarana', pageKey: 'sanskar-namakarana', labels: { en: 'Namakarana', gu: 'નામકરણ' }, timingKey: 'timing' },
	{ slug: 'nishkramana', pageKey: 'sanskar-nishkramana', labels: { en: 'Nishkramana', gu: 'નિષ્ક્રમણ' }, timingKey: 'timing' },
	{ slug: 'annaprashan', pageKey: 'sanskar-annaprashan', labels: { en: 'Annaprashan', gu: 'અન્નપ્રાશન' }, timingKey: 'timing' },
	{ slug: 'chudakarana', pageKey: 'sanskar-chudakarana', labels: { en: 'Chudakarana (Mundan)', gu: 'ચૂડાકરણ (મુંડન)' }, timingKey: 'timing' },
	{ slug: 'karnavedha', pageKey: 'sanskar-karnavedha', labels: { en: 'Karnavedha', gu: 'કર્ણવેધ' }, timingKey: 'timing' },
	{ slug: 'vidyarambha', pageKey: 'sanskar-vidyarambha', labels: { en: 'Vidyarambha', gu: 'વિદ્યારંભ' }, timingKey: 'timing' },
	{ slug: 'upanayana', pageKey: 'sanskar-upanayana', labels: { en: 'Upanayana', gu: 'ઉપનયન' }, timingKey: 'timing' },
	{ slug: 'vedarambha', pageKey: 'sanskar-vedarambha', labels: { en: 'Vedarambha', gu: 'વેદારંભ' }, timingKey: 'timing' },
	{ slug: 'samavartana', pageKey: 'sanskar-samavartana', labels: { en: 'Samavartana', gu: 'સમાવર્તન' }, timingKey: 'timing' },
	{ slug: 'vivaha', pageKey: 'sanskar-vivaha', labels: { en: 'Vivaha', gu: 'વિવાહ' }, timingKey: 'timing' },
	{ slug: 'vanaprastha', pageKey: 'sanskar-vanaprastha', labels: { en: 'Vanaprastha', gu: 'વાનપ્રસ્થ' }, timingKey: 'timing' },
	{ slug: 'antyesti', pageKey: 'sanskar-antyesti', labels: { en: 'Antyesti', gu: 'અંત્યેષ્ટિ' }, timingKey: 'timing' },
] as const;

export const PHOTO_ACTIVITY_TAGS = [
	{ value: '', label: { en: 'All activities', gu: 'બધી પ્રવૃત્તિઓ' } },
	{ value: 'gaushala', label: { en: 'Gaushala', gu: 'ગૌશાળા' } },
	{ value: 'gurukul', label: { en: 'Gurukul', gu: 'ગુરુકુલ' } },
	{ value: 'yagya', label: { en: 'Yagya', gu: 'યજ્ઞ' } },
	{ value: 'festival', label: { en: 'Festival', gu: 'ઉત્સવ' } },
	{ value: 'general', label: { en: 'General', gu: 'સામાન્ય' } },
	{ value: 'other', label: { en: 'Other', gu: 'અન્ય' } },
] as const;

export const DONATION_TYPES = [
	{ value: 'general', label: { en: 'General donation', gu: 'સામાન્ય દાન' } },
	{ value: 'gau_seva', label: { en: 'Gau Seva', gu: 'ગૌ સેવા' } },
	{ value: 'devkanya', label: { en: 'Devkanya sponsorship', gu: 'દેવકન્યા પ્રાયોજન' } },
	{ value: 'seva', label: { en: 'Seva / time donation', gu: 'સેવા / સમય દાન' } },
	{
		value: 'anniversary_birthday_punyatithi',
		label: { en: 'Anniversary / Birthday / Punyatithi', gu: 'વર્ષગાંઠ / જન્મદિવસ / પુણ્યતિથિ' },
	},
] as const;

export const OCCASION_TYPES = [
	{ value: 'anniversary', label: { en: 'Anniversary', gu: 'વર્ષગાંઠ' } },
	{ value: 'birthday', label: { en: 'Birthday', gu: 'જન્મદિવસ' } },
	{ value: 'punyatithi', label: { en: 'Punyatithi', gu: 'પુણ્યતિથિ' } },
] as const;
