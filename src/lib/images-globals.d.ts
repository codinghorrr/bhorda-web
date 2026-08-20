/** Workerd image processing globals (OffscreenCanvas, createImageBitmap). */
interface OffscreenCanvasRenderingContext2D {
	drawImage(image: ImageBitmap, dx: number, dy: number, dw: number, dh: number): void;
}

interface OffscreenCanvas {
	getContext(contextId: '2d'): OffscreenCanvasRenderingContext2D | null;
	convertToBlob(options?: { type?: string; quality?: number }): Promise<Blob>;
}

interface ImageBitmap {
	readonly width: number;
	readonly height: number;
	close(): void;
}

declare const OffscreenCanvas: {
	new (width: number, height: number): OffscreenCanvas;
};

declare function createImageBitmap(image: Blob): Promise<ImageBitmap>;
