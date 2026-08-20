import { validateCsrf } from '../lib/csrf';
import { deriveSessionSigningKey } from '../lib/crypto';

export async function validateAdminPost(request: Request, env: Env, form: FormData): Promise<boolean> {
	const key = await deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
	return validateCsrf(request, String(form.get('csrf_token') ?? ''), key);
}

export function csrfInput(token: string): string {
	return `<input type="hidden" name="csrf_token" value="${token.replace(/"/g, '&quot;')}" />`;
}

export async function getCsrfToken(env: Env): Promise<string> {
	const { createSignedCsrfToken } = await import('./templates');
	return createSignedCsrfToken(env);
}
