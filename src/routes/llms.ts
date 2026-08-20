import { localizedPath } from '../lib/i18n';
import { SITE_NAME, SITE_ORIGIN } from '../lib/site';
import { collectLlmsContent } from '../lib/site-urls';

export async function buildLlmsTxt(env: Env, origin: string, full: boolean): Promise<string> {
	const items = await collectLlmsContent(env.DB);
	const lines: string[] = [
		`# ${SITE_NAME}`,
		`> Bilingual (English/Gujarati) informational site for Gayatri Kamdhenu Sevatirth, Bhorda.`,
		`> No online payments. Donation and seva interest forms only.`,
		'',
		'## Primary pages',
	];

	for (const item of items) {
		const enUrl = `${origin}${localizedPath('en', item.pathname)}`;
		const guUrl = `${origin}${localizedPath('gu', item.pathname)}`;
		if (full) {
			lines.push(`- [${item.title}](${enUrl})`);
			lines.push(`  - Gujarati: ${guUrl}`);
			lines.push(`  - ${item.summary}`);
		} else {
			lines.push(`- [${item.title}](${enUrl}): ${item.summary}`);
		}
	}

	if (!full) {
		lines.push('', `Full content index: ${origin}/llms-full.txt`);
	}

	lines.push('', `Sitemap: ${origin}/sitemap.xml`);
	return `${lines.join('\n')}\n`;
}

export async function handleLlms(request: Request, env: Env, full: boolean): Promise<Response> {
	const origin = new URL(request.url).origin || SITE_ORIGIN;
	const body = await buildLlmsTxt(env, origin, full);
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
