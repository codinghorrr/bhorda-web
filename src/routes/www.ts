const APEX_HOST = 'sevatirthbhorda.org';
const WWW_HOST = 'www.sevatirthbhorda.org';

/** 301 www → apex. Local `wrangler dev` hosts are left unchanged. */
export function redirectWwwToApex(request: Request): Response | null {
	const url = new URL(request.url);
	if (url.hostname !== WWW_HOST) {
		return null;
	}

	url.hostname = APEX_HOST;
	return Response.redirect(url.toString(), 301);
}
