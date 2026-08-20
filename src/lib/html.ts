/** Escape text for safe HTML interpolation. */
export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function htmlResponse(html: string, init?: ResponseInit & { locale?: string }): Response {
	const headers = new Headers(init?.headers);
	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'text/html; charset=utf-8');
	}
	if (init?.locale) {
		headers.append('Set-Cookie', `lang_pref=${init.locale}; Path=/; Max-Age=31536000; SameSite=Lax`);
	}
	return new Response(html, { ...init, headers });
}
