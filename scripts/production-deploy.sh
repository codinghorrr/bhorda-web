#!/usr/bin/env bash
# Production deploy helper — requires CLOUDFLARE_API_TOKEN in the environment.
# Worker secrets (SUPERADMIN_PASSWORD, SES_*, SENDY_*, GA4_ID) must already be
# set via `wrangler secret put` on the Cloudflare account.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
	echo "ERROR: CLOUDFLARE_API_TOKEN is not set. Add it to Cloud Agent environment secrets." >&2
	exit 1
fi

npm run cf-typegen
npm run db:migrate:remote
npm run deploy

echo "Deployed. Verify:"
echo "  curl -sS https://sevatirthbhorda.org/health"
