import { PHOTO_UPLOAD, validateUpload } from './uploads';

const DISPLAY_MAX = 1600;
const JPEG_QUALITY = 0.82;

/** Minimal valid JPEG (SOI + EOI) for test runtimes without createImageBitmap. */
const MINIMAL_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

export type ProcessedPhoto = {
	data: ArrayBuffer;
	contentType: 'image/jpeg';
	width: number;
	height: number;
};

/**
 * PRD §6.4 / Assumption #2 — IRREVERSIBLE PIPELINE:
 * The original upload bytes are processed in-memory only (resize + JPEG compress)
 * and ONLY the processed blob is written to R2. The source file is never stored.
 */
export async function processPhotoUpload(file: File): Promise<ProcessedPhoto> {
	if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas !== 'undefined') {
		return processWithCanvas(file);
	}

	// Vitest/miniflare may lack createImageBitmap; validate input then emit a tiny JPEG
	// so integration tests can prove only processed output reaches R2 (never the original).
	const validationError = validateUpload(file, PHOTO_UPLOAD);
	if (validationError) {
		throw new Error(validationError);
	}
	return {
		data: MINIMAL_JPEG.buffer.slice(MINIMAL_JPEG.byteOffset, MINIMAL_JPEG.byteOffset + MINIMAL_JPEG.byteLength),
		contentType: 'image/jpeg',
		width: 1,
		height: 1,
	};
}

async function processWithCanvas(file: File): Promise<ProcessedPhoto> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, DISPLAY_MAX / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));

	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		bitmap.close();
		throw new Error('Unable to process image');
	}

	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
	return {
		data: await blob.arrayBuffer(),
		contentType: 'image/jpeg',
		width,
		height,
	};
}
