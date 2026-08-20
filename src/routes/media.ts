/** Serve processed media objects from R2 at /media/{key}. */
export async function handleMedia(request: Request, env: Env): Promise<Response | null> {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return null;
	}

	const url = new URL(request.url);
	if (!url.pathname.startsWith('/media/')) {
		return null;
	}

	const key = decodeURIComponent(url.pathname.slice('/media/'.length));
	if (!key || key.includes('..') || key.startsWith('/')) {
		return new Response('Not Found', { status: 404 });
	}

	const object = await env.MEDIA.get(key);
	if (!object) {
		return new Response('Not Found', { status: 404 });
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(request.method === 'HEAD' ? null : object.body, {
		status: 200,
		headers,
	});
}
