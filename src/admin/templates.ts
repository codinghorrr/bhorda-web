import { createCsrfToken, csrfCookieHeader, signCsrfToken } from '../lib/csrf';
import { deriveSessionSigningKey } from '../lib/crypto';
import { escapeHtml } from '../lib/html';

export type AdminLayoutOptions = {
	title: string;
	activePath: string;
	email: string;
	role: string;
	navHtml: string;
	content: string;
	csrfToken: string;
};

export function renderAdminLayout(options: AdminLayoutOptions): string {
	const { title, activePath, email, role, navHtml, content, csrfToken } = options;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>${escapeHtml(title)} · Vedmata Admin</title>
	<link rel="stylesheet" href="/styles/admin.css" />
</head>
<body class="admin-body">
	<div class="admin-shell">
		<aside class="admin-sidebar" aria-label="Admin navigation">
			<div class="admin-brand">
				<p class="admin-brand-title">Vedmata</p>
				<p class="admin-brand-sub">Sevatirth Bhorda</p>
			</div>
			<nav class="admin-nav">${navHtml}</nav>
			<div class="admin-user">
				<p class="admin-user-email">${escapeHtml(email)}</p>
				<p class="admin-user-role">${escapeHtml(role)}</p>
				<form method="post" action="/vedmata/logout">
					<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}" />
					<button class="btn btn--ghost" type="submit">Log out</button>
				</form>
			</div>
		</aside>
		<div class="admin-main">
			<header class="admin-topbar">
				<h1 class="admin-page-title">${escapeHtml(title)}</h1>
			</header>
			<main class="admin-content">${content}</main>
		</div>
	</div>
</body>
</html>`;
}

export function renderNavLinks(items: { path: string; label: string }[], activePath: string): string {
	return items
		.map((item) => {
			const active = activePath === item.path;
			const cls = active ? 'admin-nav-link is-active' : 'admin-nav-link';
			return `<a class="${cls}" href="${escapeHtml(item.path)}"${active ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`;
		})
		.join('');
}

export async function createSignedCsrfToken(env: Env): Promise<string> {
	const signingKey = await deriveSessionSigningKey(env.SUPERADMIN_PASSWORD);
	const token = createCsrfToken();
	return signCsrfToken(token, signingKey);
}

export type LoginViewOptions = {
	csrfToken: string;
	step: 'email' | 'otp' | 'password';
	email?: string;
	message?: string;
	error?: string;
};

export function renderLoginPage(options: LoginViewOptions): string {
	const { csrfToken, step, email = '', message, error } = options;

	const alert = error
		? `<p class="admin-alert admin-alert--error" role="alert">${escapeHtml(error)}</p>`
		: message
			? `<p class="admin-alert admin-alert--info" role="status">${escapeHtml(message)}</p>`
			: '';

	const emailStep =
		step === 'email'
			? `<form class="admin-form" method="post" action="/vedmata/login/identify">
		<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}" />
		<label class="admin-label" for="email">Email address</label>
		<input class="admin-input" id="email" name="email" type="email" required autocomplete="username" />
		<button class="btn btn--gold" type="submit">Continue</button>
	</form>`
			: '';

	const otpStep =
		step === 'otp'
			? `<form class="admin-form" method="post" action="/vedmata/auth/otp/verify">
		<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}" />
		<input type="hidden" name="email" value="${escapeHtml(email)}" />
		<p class="admin-form-hint">A 6-digit code was sent to <strong>${escapeHtml(email)}</strong>.</p>
		<label class="admin-label" for="code">One-time code</label>
		<input class="admin-input" id="code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required autocomplete="one-time-code" />
		<button class="btn btn--gold" type="submit">Verify & sign in</button>
	</form>
	<form class="admin-form admin-form--inline" method="post" action="/vedmata/auth/otp/request">
		<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}" />
		<input type="hidden" name="email" value="${escapeHtml(email)}" />
		<button class="btn btn--ghost" type="submit">Resend code</button>
	</form>`
			: '';

	const passwordStep =
		step === 'password'
			? `<form class="admin-form" method="post" action="/vedmata/auth/superadmin">
		<input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}" />
		<input type="hidden" name="email" value="${escapeHtml(email)}" />
		<p class="admin-form-hint">Superadmin sign-in for <strong>${escapeHtml(email)}</strong>.</p>
		<label class="admin-label" for="password">Password</label>
		<input class="admin-input" id="password" name="password" type="password" required autocomplete="current-password" />
		<button class="btn btn--gold" type="submit">Sign in</button>
	</form>`
			: '';

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Sign in · Vedmata Admin</title>
	<link rel="stylesheet" href="/styles/admin.css" />
</head>
<body class="admin-body admin-body--login">
	<main class="admin-login-card">
		<h1 class="admin-login-title">Vedmata Admin</h1>
		<p class="admin-login-sub">Gayatri Kamdhenu Sevatirth, Bhorda</p>
		${alert}
		${emailStep}
		${otpStep}
		${passwordStep}
	</main>
</body>
</html>`;
}

export function renderPlaceholderPage(title: string, description: string): string {
	return `<div class="admin-placeholder">
		<p class="admin-placeholder-lead">${escapeHtml(description)}</p>
		<p class="admin-placeholder-note">This screen is a routing shell only — functionality arrives in a later phase.</p>
	</div>`;
}

export function renderForbiddenPage(): string {
	return `<div class="admin-placeholder">
		<h2>Access denied</h2>
		<p class="admin-placeholder-lead">Your account does not have permission to view this section.</p>
		<p><a href="/vedmata">Return to admin home</a></p>
	</div>`;
}
