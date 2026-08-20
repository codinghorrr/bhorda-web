#!/usr/bin/env bash
# Production deploy helper — requires CLOUDFLARE_API_TOKEN in the environment.
# Worker secrets (SUPERADMIN_PASSWORD, SES_*) must already be set via `wrangler secret put`.
# SENDY_* and GA4_ID are optional — the site degrades gracefully when unset.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
	echo "ERROR: CLOUDFLARE_API_TOKEN is not set. Add it to Cloud Agent environment secrets." >&2
	exit 1
fi

npm run typecheck
npm run cf-typegen
npm run db:migrate:remote
npm run deploy

echo "Deployed. Verify:"
echo "  curl -sS https://sevatirthbhorda.org/health"
