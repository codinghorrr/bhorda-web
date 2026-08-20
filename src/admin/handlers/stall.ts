import type { AuthSession } from '../../lib/auth';
import { randomId } from '../../lib/crypto';
import { escapeHtml } from '../../lib/html';
import { processPhotoUpload } from '../../lib/images';
import { publicMediaUrl, putObject } from '../../lib/r2';
import { STALL_PHOTO_UPLOAD, validateUpload } from '../../lib/uploads';
import { actions, alert, checkbox, field, hidden } from '../forms';
import { getCsrfToken, validateAdminPost } from '../middleware';
import { adminRedirect, renderAdminPage } from '../render';
import { adminHtmlResponse } from '../security';

type StallRow = {
	id: string;
	name_en: string;
	name_gu: string | null;
	price: number;
	photo_url: string | null;
	in_stock: number;
};

export async function handleStallRoutes(
	request: Request,
	env: Env,
	session: AuthSession,
	pathname: string,
): Promise<Response | null> {
	if (!pathname.startsWith('/vedmata/stall')) {
		return null;
	}

	if (pathname === '/vedmata/stall' && request.method === 'GET') {
		return list(request, env, session);
	}
	if (pathname === '/vedmata/stall/new' && request.method === 'GET') {
		return form(request, env, session, null);
	}
	if (pathname === '/vedmata/stall' && request.method === 'POST') {
		return save(request, env, session, null);
	}

	const edit = /^\/vedmata\/stall\/([^/]+)\/edit$/.exec(pathname);
	if (edit && request.method === 'GET') {
		return form(request, env, session, edit[1]!);
	}
	const update = /^\/vedmata\/stall\/([^/]+)$/.exec(pathname);
	if (update && request.method === 'POST') {
		return save(request, env, session, update[1]!);
	}
	const del = /^\/vedmata\/stall\/([^/]+)\/delete$/.exec(pathname);
	if (del && request.method === 'POST') {
		return remove(request, env, session, del[1]!);
	}

	return adminHtmlResponse('Not Found', { status: 404 });
}

async function list(request: Request, env: Env, session: AuthSession): Promise<Response> {
	const rows = await env.DB.prepare('SELECT * FROM stall_items ORDER BY name_en').all<StallRow>();
	const items =
		rows.results
			?.map((r) => {
				const stock = r.in_stock ? 'In stock' : 'Out of stock';
				const stockClass = r.in_stock ? '' : ' admin-badge--muted';
				return `<tr>
			<td>${escapeHtml(r.name_en)}</td>
			<td>${escapeHtml(r.name_gu ?? '')}</td>
			<td>₹${escapeHtml(String(r.price))}</td>
			<td><span class="admin-badge${stockClass}">${escapeHtml(stock)}</span></td>
			<td><a href="/vedmata/stall/${escapeHtml(r.id)}/edit">Edit</a></td>
		</tr>`;
			})
			.join('') ?? '';

	return renderAdminPage(request, env, {
		session,
		title: 'Sahitya Stall',
		activePath: '/vedmata/stall',
		content: `<div class="admin-toolbar"><a class="btn btn--gold" href="/vedmata/stall/new">Add item</a></div>
<table class="admin-table"><thead><tr><th>Name (EN)</th><th>Name (GU)</th><th>Price</th><th>Stock</th><th></th></tr></thead>
<tbody>${items || '<tr><td colspan="5">No stall items yet.</td></tr>'}</tbody></table>`,
	});
}

async function form(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const csrf = await getCsrfToken(env);
	let row: StallRow | null = null;
	if (id) {
		row = await env.DB.prepare('SELECT * FROM stall_items WHERE id = ?').bind(id).first<StallRow>();
		if (!row) return adminRedirect('/vedmata/stall');
	}
	const action = id ? `/vedmata/stall/${id}` : '/vedmata/stall';
	const content = `<form class="admin-form admin-form--wide" method="post" action="${action}" enctype="multipart/form-data">
${hidden('csrf_token', csrf)}
${field('Name (English)', 'name_en', row?.name_en ?? '', { required: true })}
${field('Name (Gujarati)', 'name_gu', row?.name_gu ?? '')}
${field('Price (₹)', 'price', row ? String(row.price) : '', { type: 'number', required: true, placeholder: '0.00' })}
${checkbox('In stock', 'in_stock', row ? row.in_stock === 1 : true)}
<label class="admin-label" for="photo">Photo (optional)</label>
<input class="admin-input" id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
${row?.photo_url ? `<p class="admin-form-hint">Current: <a href="${escapeHtml(row.photo_url)}" target="_blank" rel="noopener">view</a></p>` : ''}
${actions(id ? 'Update item' : 'Create item')}
</form>
${id ? `<form method="post" action="/vedmata/stall/${escapeHtml(id)}/delete" onsubmit="return confirm('Delete this stall item?')">${hidden('csrf_token', csrf)}<button class="btn btn--ghost admin-danger" type="submit">Delete</button></form>` : ''}`;

	return renderAdminPage(request, env, {
		session,
		title: id ? 'Edit stall item' : 'New stall item',
		activePath: '/vedmata/stall',
		content,
	});
}

async function save(request: Request, env: Env, session: AuthSession, id: string | null): Promise<Response> {
	const formData = await request.formData();
	if (!(await validateAdminPost(request, env, formData))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}

	const nameEn = String(formData.get('name_en') ?? '').trim();
	const nameGu = String(formData.get('name_gu') ?? '').trim() || null;
	const price = Number(formData.get('price'));
	const inStock = formData.get('in_stock') === '1' ? 1 : 0;

	if (!nameEn || !Number.isFinite(price) || price < 0) {
		return form(request, env, session, id);
	}

	const itemId = id ?? randomId('stl');
	let photoUrl: string | null = null;
	if (id) {
		const existing = await env.DB.prepare('SELECT photo_url FROM stall_items WHERE id = ?')
			.bind(id)
			.first<{ photo_url: string | null }>();
		photoUrl = existing?.photo_url ?? null;
	}

	const photo = formData.get('photo');
	if (photo instanceof File && photo.size > 0) {
		const err = validateUpload(photo, STALL_PHOTO_UPLOAD);
		if (err) {
			return renderAdminPage(request, env, {
				session,
				title: 'Sahitya Stall',
				activePath: '/vedmata/stall',
				content: alert(err, 'error'),
			});
		}
		const processed = await processPhotoUpload(photo);
		const key = `stall/${itemId}.jpg`;
		await putObject(env.MEDIA, key, processed.data, processed.contentType);
		photoUrl = publicMediaUrl(key);
	}

	if (id) {
		await env.DB.prepare(
			'UPDATE stall_items SET name_en=?, name_gu=?, price=?, photo_url=?, in_stock=? WHERE id=?',
		)
			.bind(nameEn, nameGu, price, photoUrl, inStock, id)
			.run();
	} else {
		await env.DB.prepare(
			'INSERT INTO stall_items (id, name_en, name_gu, price, photo_url, in_stock) VALUES (?, ?, ?, ?, ?, ?)',
		)
			.bind(itemId, nameEn, nameGu, price, photoUrl, inStock)
			.run();
	}

	return adminRedirect('/vedmata/stall');
}

async function remove(request: Request, env: Env, session: AuthSession, id: string): Promise<Response> {
	const form = await request.formData();
	if (!(await validateAdminPost(request, env, form))) {
		return adminHtmlResponse('Forbidden', { status: 403 });
	}
	await env.DB.prepare('DELETE FROM stall_items WHERE id = ?').bind(id).run();
	return adminRedirect('/vedmata/stall');
}
