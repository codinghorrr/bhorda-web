import { describe, expect, it } from 'vitest';
import { processPhotoUpload } from '../src/lib/images';

const TINY_PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVRAI2P8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function base64ToUint8Array(b64: string): Uint8Array {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

describe('processPhotoUpload', () => {
	it('returns JPEG bytes that differ from the PNG source', async () => {
		const originalBytes = base64ToUint8Array(TINY_PNG_BASE64);
		const original = new File([originalBytes], 'source.png', { type: 'image/png' });

		const processed = await processPhotoUpload(original);

		expect(processed.contentType).toBe('image/jpeg');
		const output = new Uint8Array(processed.data);
		expect(output[0]).toBe(0xff);
		expect(output[1]).toBe(0xd8);
		expect(output).not.toEqual(originalBytes);
	});
});
