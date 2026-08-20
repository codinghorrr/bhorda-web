/** Admin-specific security headers (PRD §10). */
const ADMIN_CSP =
	"default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'";

const ADMIN_HEADERS: Record<string, string> = {
	'Content-Security-Policy': ADMIN_CSP,
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
	'Cache-Control': 'no-store',
};

export function applyAdminSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(ADMIN_HEADERS)) {
		headers.set(name, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function adminHtmlResponse(
	html: string,
	init?: ResponseInit & { cookies?: string[] },
): Response {
	const headers = new Headers(init?.headers);
	headers.set('Content-Type', 'text/html; charset=utf-8');
	for (const cookie of init?.cookies ?? []) {
		headers.append('Set-Cookie', cookie);
	}
	return applyAdminSecurityHeaders(
		new Response(html, {
			...init,
			headers,
		}),
	);
}
