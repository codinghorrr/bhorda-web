import { sendSesEmail } from './ses';

const PLACEHOLDER_KEY = 'replace-me-local-only';

export async function sendOtpEmail(env: Env, to: string, code: string): Promise<void> {
	const subject = 'Your Sevatirth Bhorda admin login code';
	const body = `Your one-time login code is ${code}.\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`;

	if (env.SES_ACCESS_KEY === PLACEHOLDER_KEY || env.SES_SECRET_KEY === PLACEHOLDER_KEY) {
		console.log(`[DEV] OTP email to ${to}: ${code}`);
		return;
	}

	const from = env.SES_FROM_EMAIL ?? 'noreply@sevatirthbhorda.org';
	const region = env.SES_REGION ?? 'ap-south-1';

	await sendSesEmail({
		region,
		accessKeyId: env.SES_ACCESS_KEY,
		secretAccessKey: env.SES_SECRET_KEY,
		from,
		to,
		subject,
		text: body,
	});
}
