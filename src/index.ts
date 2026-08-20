import { handleRequest } from './routes';
import { processDueReminders } from './cron/reminders';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return handleRequest(request, env, ctx);
	},
	async scheduled(_event, env, _ctx): Promise<void> {
		await processDueReminders(env);
	},
} satisfies ExportedHandler<Env>;
