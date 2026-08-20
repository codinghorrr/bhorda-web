import { handleAdmin } from '../admin';
import { applySecurityHeaders } from '../lib/security';
import { handleHealth } from './health';
import { redirectWwwToApex } from './www';

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const wwwRedirect = redirectWwwToApex(request);
	if (wwwRedirect) {
		return applySecurityHeaders(wwwRedirect);
	}

	const url = new URL(request.url);

	if (request.method === 'GET' && url.pathname === '/health') {
		return applySecurityHeaders(handleHealth());
	}

	if (url.pathname === '/vedmata' || url.pathname.startsWith('/vedmata/')) {
		return applySecurityHeaders(await handleAdmin(request, env, ctx));
	}

	return applySecurityHeaders(new Response('Not Found', { status: 404 }));
}
