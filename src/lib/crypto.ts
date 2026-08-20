const encoder = new TextEncoder();

export function randomId(prefix = ''): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
	return prefix ? `${prefix}_${hex}` : hex;
}

export function randomToken(bytes = 32): string {
	const value = new Uint8Array(bytes);
	crypto.getRandomValues(value);
	return [...value].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateOtpCode(): string {
	const bytes = new Uint8Array(4);
	crypto.getRandomValues(bytes);
	const value = (bytes[0]! << 16) | (bytes[1]! << 8) | bytes[2]!;
	return String(value % 1_000_000).padStart(6, '0');
}

export async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
	return bufferToHex(digest);
}

export async function hmacSha256Base64Url(message: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
	return base64UrlEncode(new Uint8Array(signature));
}

export function timingSafeEqualString(a: string, b: string): boolean {
	const aa = encoder.encode(a);
	const bb = encoder.encode(b);
	return timingSafeEqualBytes(aa, bb);
}

export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a[i]! ^ b[i]!;
	}
	return result === 0;
}

export async function deriveSessionSigningKey(superadminPassword: string): Promise<string> {
	return sha256Hex(`vedmata-session:${superadminPassword}`);
}

function bufferToHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
