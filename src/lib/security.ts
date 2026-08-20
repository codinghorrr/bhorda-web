/** Baseline headers from PRD §10. */
const SECURITY_HEADERS: Record<string, string> = {
	'Content-Security-Policy':
		"default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
		"font-src 'self' https://fonts.gstatic.com data:; " +
		"img-src 'self' data: https:; " +
		"script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://www.googletagmanager.com; " +
		"connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://cloudflareinsights.com",
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'X-Frame-Options': 'DENY',
};

export function applySecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		headers.set(name, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function getSecurityHeaderNames(): string[] {
	return Object.keys(SECURITY_HEADERS);
}
