/** Serve files from the ASSETS binding without locale-prefix redirects. */
export async function tryServeStaticAsset(request: Request, env: Env): Promise<Response | null> {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return null;
	}

	const { pathname } = new URL(request.url);
	if (!isStaticAssetPath(pathname)) {
		return null;
	}

	const assetResponse = await env.ASSETS.fetch(request);
	return assetResponse.status === 404 ? null : assetResponse;
}

function isStaticAssetPath(pathname: string): boolean {
	return (
		pathname.startsWith('/styles/') ||
		pathname.startsWith('/fonts/') ||
		pathname.startsWith('/images/') ||
		/\.(?:css|js|png|jpe?g|gif|svg|webp|ico|woff2?|txt)$/i.test(pathname)
	);
}
