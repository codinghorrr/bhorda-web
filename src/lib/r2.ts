export async function putObject(
	bucket: R2Bucket,
	key: string,
	body: ArrayBuffer | ReadableStream | string,
	contentType: string,
): Promise<void> {
	await bucket.put(key, body, {
		httpMetadata: { contentType },
	});
}

export async function deleteObject(bucket: R2Bucket, key: string): Promise<void> {
	await bucket.delete(key);
}

export function mediaKeyFromUrl(url: string): string | null {
	const prefix = '/media/';
	const idx = url.indexOf(prefix);
	if (idx === -1) {
		return null;
	}
	return url.slice(idx + prefix.length);
}

export function publicMediaUrl(path: string): string {
	return `/media/${path.replace(/^\/+/, '')}`;
}
