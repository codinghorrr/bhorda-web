export type UploadRule = {
	maxBytes: number;
	allowedMime: readonly string[];
	label: string;
};

export const PHOTO_UPLOAD: UploadRule = {
	label: 'photo',
	maxBytes: 10 * 1024 * 1024,
	allowedMime: ['image/jpeg', 'image/png', 'image/webp'],
};

export const AUDIO_UPLOAD: UploadRule = {
	label: 'audio',
	maxBytes: 50 * 1024 * 1024,
	allowedMime: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav'],
};

export const STALL_PHOTO_UPLOAD: UploadRule = {
	label: 'stall photo',
	maxBytes: 8 * 1024 * 1024,
	allowedMime: ['image/jpeg', 'image/png', 'image/webp'],
};

export function validateUpload(file: File, rule: UploadRule): string | null {
	if (!file || file.size === 0) {
		return `A ${rule.label} file is required.`;
	}
	if (file.size > rule.maxBytes) {
		return `${rule.label} must be ${Math.round(rule.maxBytes / (1024 * 1024))}MB or smaller.`;
	}
	const mime = file.type || 'application/octet-stream';
	if (!rule.allowedMime.includes(mime)) {
		return `Unsupported ${rule.label} type: ${mime}`;
	}
	return null;
}
