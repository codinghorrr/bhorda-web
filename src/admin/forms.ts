import { escapeHtml } from '../lib/html';

export function hidden(name: string, value: string): string {
	return `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`;
}

export function field(
	label: string,
	name: string,
	value: string,
	options?: { type?: string; required?: boolean; placeholder?: string; rows?: number },
): string {
	const type = options?.type ?? 'text';
	const req = options?.required ? ' required' : '';
	const placeholder = options?.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : '';

	if (type === 'textarea') {
		const rows = options?.rows ?? 4;
		return `<label class="admin-label" for="${escapeHtml(name)}">${escapeHtml(label)}</label>
<textarea class="admin-input admin-textarea" id="${escapeHtml(name)}" name="${escapeHtml(name)}" rows="${rows}"${req}>${escapeHtml(value)}</textarea>`;
	}

	return `<label class="admin-label" for="${escapeHtml(name)}">${escapeHtml(label)}</label>
<input class="admin-input" id="${escapeHtml(name)}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}"${placeholder}${req} />`;
}

export function select(
	label: string,
	name: string,
	value: string,
	options: { value: string; label: string }[],
): string {
	const opts = options
		.map((o) => `<option value="${escapeHtml(o.value)}"${o.value === value ? ' selected' : ''}>${escapeHtml(o.label)}</option>`)
		.join('');
	return `<label class="admin-label" for="${escapeHtml(name)}">${escapeHtml(label)}</label>
<select class="admin-input" id="${escapeHtml(name)}" name="${escapeHtml(name)}">${opts}</select>`;
}

export function checkbox(label: string, name: string, checked: boolean): string {
	return `<label class="admin-check"><input type="checkbox" name="${escapeHtml(name)}" value="1"${checked ? ' checked' : ''} /> ${escapeHtml(label)}</label>`;
}

export function alert(message: string, type: 'error' | 'info' = 'info'): string {
	const cls = type === 'error' ? 'admin-alert admin-alert--error' : 'admin-alert admin-alert--info';
	return `<p class="${cls}" role="${type === 'error' ? 'alert' : 'status'}">${escapeHtml(message)}</p>`;
}

export function actions(saveLabel = 'Save'): string {
	return `<div class="admin-actions"><button class="btn btn--gold" type="submit">${escapeHtml(saveLabel)}</button></div>`;
}
