import type { Locale } from '../lib/i18n';
import { escapeHtml } from '../lib/html';
import { uiCopy } from '../lib/ui-copy';

export type TimelineEvent = {
	id: string;
	year: number;
	title: string;
	description: string;
	imageUrl: string | null;
};

export function renderTimeline(events: TimelineEvent[], locale: Locale): string {
	if (events.length === 0) {
		return `<p class="lead">${locale === 'gu' ? 'સમયરેખા ટૂંક સમયમાં ઉપલબ્ધ થશે.' : 'Timeline content will appear here soon.'}</p>`;
	}

	const items = events
		.map((event, index) => {
			const image = event.imageUrl
				? `<img class="timeline__image" src="${escapeHtml(event.imageUrl)}" alt="" loading="lazy" />`
				: '';
			const isActive = index === 0 ? ' is-active' : '';
			return `<li class="timeline__item${isActive}">
	<button class="timeline__marker" type="button" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="timeline-panel-${escapeHtml(event.id)}" data-timeline-trigger="${escapeHtml(event.id)}">
		<span class="timeline__year">${escapeHtml(String(event.year))}</span>
		<span class="timeline__title">${escapeHtml(event.title)}</span>
	</button>
	<div class="timeline__panel" id="timeline-panel-${escapeHtml(event.id)}"${index === 0 ? '' : ' hidden'}>
		${image}
		<p class="timeline__desc">${escapeHtml(event.description)}</p>
	</div>
</li>`;
		})
		.join('');

	return `<div class="timeline" data-timeline>
	<ol class="timeline__list">${items}</ol>
</div>
<script>
document.querySelectorAll('[data-timeline-trigger]').forEach(function(btn) {
	btn.addEventListener('click', function() {
		var root = btn.closest('[data-timeline]');
		if (!root) return;
		root.querySelectorAll('.timeline__item').forEach(function(item) { item.classList.remove('is-active'); });
		root.querySelectorAll('.timeline__panel').forEach(function(panel) { panel.hidden = true; });
		root.querySelectorAll('[data-timeline-trigger]').forEach(function(b) { b.setAttribute('aria-expanded', 'false'); });
		btn.closest('.timeline__item').classList.add('is-active');
		btn.setAttribute('aria-expanded', 'true');
		var panel = document.getElementById(btn.getAttribute('aria-controls'));
		if (panel) panel.hidden = false;
	});
});
</script>`;
}

export type PublicFormField =
	| { type: 'text' | 'email' | 'tel' | 'date'; name: string; label: string; required?: boolean }
	| { type: 'textarea'; name: string; label: string; required?: boolean; rows?: number }
	| { type: 'select'; name: string; label: string; required?: boolean; options: { value: string; label: string }[] }
	| { type: 'hidden'; name: string; value: string };

export type PublicFormOptions = {
	formType: string;
	locale: Locale;
	action?: string;
	title?: string;
	fields?: PublicFormField[];
	hiddenFields?: Record<string, string>;
	submitted?: boolean;
};

export function renderPublicForm(options: PublicFormOptions): string {
	const copy = uiCopy(options.locale);
	const action = options.action ?? '/api/forms/submit';

	if (options.submitted) {
		return `<p class="form-success" role="status">${escapeHtml(copy.submitted)}</p>`;
	}

	const hidden: PublicFormField[] = [
		{ type: 'hidden', name: 'form_type', value: options.formType },
		{ type: 'hidden', name: 'locale', value: options.locale },
	];
	for (const [name, value] of Object.entries(options.hiddenFields ?? {})) {
		hidden.push({ type: 'hidden', name, value });
	}

	const defaultFields: PublicFormField[] = [
		{ type: 'text', name: 'name', label: copy.name, required: true },
		{ type: 'email', name: 'email', label: copy.email, required: true },
		{ type: 'tel', name: 'phone', label: copy.phone },
		{ type: 'textarea', name: 'message', label: copy.message, rows: 4 },
	];

	const fields = options.fields ?? defaultFields;
	const allFields = [...hidden, ...fields];

	const inputs = allFields
		.map((field) => {
			if (field.type === 'hidden') {
				return `<input type="hidden" name="${escapeHtml(field.name)}" value="${escapeHtml(field.value)}" />`;
			}
			const req = field.required ? ' required' : '';
			if (field.type === 'textarea') {
				return `<label class="form-label" for="${escapeHtml(field.name)}">${escapeHtml(field.label)}</label>
<textarea class="form-input" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" rows="${field.rows ?? 4}"${req}></textarea>`;
			}
			if (field.type === 'select') {
				const opts = field.options
					.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
					.join('');
				return `<label class="form-label" for="${escapeHtml(field.name)}">${escapeHtml(field.label)}</label>
<select class="form-input" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}"${req}>${opts}</select>`;
			}
			return `<label class="form-label" for="${escapeHtml(field.name)}">${escapeHtml(field.label)}</label>
<input class="form-input" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}" type="${escapeHtml(field.type)}"${req} />`;
		})
		.join('\n');

	const title = options.title ? `<h2 class="form-title">${escapeHtml(options.title)}</h2>` : '';

	return `${title}<form class="public-form" method="post" action="${escapeHtml(action)}">
${inputs}
<button class="btn btn--gold" type="submit">${escapeHtml(copy.submit)}</button>
</form>`;
}

export function renderSubNav(
	locale: Locale,
	items: { href: string; label: string; active?: boolean }[],
): string {
	const links = items
		.map((item) => {
			const cls = item.active ? 'subnav__link is-active' : 'subnav__link';
			return `<a class="${cls}" href="${escapeHtml(item.href)}"${item.active ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`;
		})
		.join('');
	return `<nav class="subnav" aria-label="${locale === 'gu' ? 'ઉપપૃષ્ઠો' : 'Sub-pages'}">${links}</nav>`;
}

export function renderRichText(html: string): string {
	return `<div class="rich-text">${html}</div>`;
}

export function textToParagraphs(text: string): string {
	return text
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
		.join('');
}
