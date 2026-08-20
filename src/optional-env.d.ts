/**
 * Optional Worker secrets — set with `wrangler secret put` when an integration is ready.
 * Omitted from wrangler.toml [secrets].required so production deploy succeeds without them.
 */
interface Env {
	SENDY_URL?: string;
	SENDY_LIST_ID?: string;
	GA4_ID?: string;
}
