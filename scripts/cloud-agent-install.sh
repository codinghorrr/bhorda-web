#!/usr/bin/env bash
# Idempotent Cloud Agent install (see .cursor/environment.json).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]] && [[ -f .env.example ]]; then
	cp .env.example .env
fi

npm ci
npm run cf-typegen
npm run db:migrate:local
