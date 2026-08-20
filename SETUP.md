# Setup — sevatirthbhorda.org

Infrastructure-only notes for the Cloudflare Workers project. Product requirements live in `PRD.md`.

## Prerequisites

- Node.js 20+
- A Cloudflare account that owns the `sevatirthbhorda.org` zone
- Wrangler 4.x (`npx wrangler` is enough; `npm install` installs it locally)

```bash
npm install
npx wrangler login
```

## Local development

```bash
cp .env.example .env
# edit .env with local-only placeholders — never commit it
npx wrangler d1 migrations apply sevatirth-bhorda --local
npm run dev
```

Confirm the health check:

```bash
curl -sS http://localhost:8787/health
# {"status":"ok","service":"sevatirth-bhorda","timestamp":"..."}
```

Local D1 and R2 are simulated by Wrangler. The `database_id` in `wrangler.toml` is a placeholder and is only used as a local identity until you create the remote database.

## Create remote D1 and R2

```bash
npx wrangler d1 create sevatirth-bhorda
npx wrangler r2 bucket create sevatirth-bhorda-media
```

Copy the printed `database_id` into `wrangler.toml` under `[[d1_databases]]`, replacing `00000000-0000-4000-8000-000000000001`.

Apply the schema to production D1 (test locally first — there is no staging database):

```bash
npx wrangler d1 migrations apply sevatirth-bhorda --local
npx wrangler d1 migrations apply sevatirth-bhorda --remote
```

## Worker secrets

Secrets are declared in `wrangler.toml` under `[secrets].required`. Do not put values in the Wrangler file or in git.

Set each production secret:

```bash
npx wrangler secret put SUPERADMIN_PASSWORD
npx wrangler secret put SES_ACCESS_KEY
npx wrangler secret put SES_SECRET_KEY
npx wrangler secret put SENDY_URL
npx wrangler secret put SENDY_LIST_ID
npx wrangler secret put GA4_ID
```

| Secret | Purpose |
|---|---|
| `SUPERADMIN_PASSWORD` | Break-glass Superadmin login (`hello@axiso.com.au`) |
| `SES_ACCESS_KEY` | Amazon SES access key for OTP / staff email |
| `SES_SECRET_KEY` | Amazon SES secret key |
| `SENDY_URL` | Sendy install base URL (newsletter form) |
| `SENDY_LIST_ID` | Sendy list id for the site subscribe form |
| `GA4_ID` | Google Analytics 4 measurement id |

List configured secrets (names only): `npx wrangler secret list`

Local values belong in `.env` (copied from `.env.example`). Wrangler also accepts `.dev.vars`; use one or the other, not both.

## Production routes

`wrangler.toml` binds:

- `sevatirthbhorda.org` (apex, canonical)
- `www.sevatirthbhorda.org` (Worker issues a 301 to the apex)

The zone must already sit on the same Cloudflare account. Deploy after secrets and the D1 id are in place:

```bash
npx wrangler types
npm run deploy
```

`workers.dev` preview URLs stay enabled so the Worker can be hit before DNS is attached.

## Admin authentication (`/vedmata`)

- **Superadmin** (`hello@axiso.com.au`): password from `SUPERADMIN_PASSWORD` secret (break-glass path).
- **Admin / Manager**: email OTP via Amazon SES (`SES_ACCESS_KEY`, `SES_SECRET_KEY`, `SES_REGION`, `SES_FROM_EMAIL`).
- Sessions are httpOnly signed cookies backed by the `sessions` D1 table.
- CSRF tokens are required on all `/vedmata` POST actions.
- Login endpoints are rate-limited via the `auth_attempts` table.

**Test fixture:** migration `0002` seeds `manager.test@sevatirthbhorda.org` (manager role) for RBAC verification — remove before production launch.

Local dev without real SES logs OTP codes to the `wrangler dev` console.


| Binding | Resource | Config |
|---|---|---|
| `DB` | D1 `sevatirth-bhorda` | `[[d1_databases]]` |
| `MEDIA` | R2 `sevatirth-bhorda-media` | `[[r2_buckets]]` |
| `ASSETS` | `./public` | `[assets]` |

Regenerate TypeScript bindings after any Wrangler config change:

```bash
npm run cf-typegen
```

## Cloud Agent environment

Repository-managed setup lives in [`.cursor/environment.json`](./.cursor/environment.json):

- **install**: `scripts/cloud-agent-install.sh` — `npm ci`, typegen, local D1 migrations
- **terminals**: `npm run dev` (Wrangler on port 8787)

Add these secrets in the Cursor Cloud Agent environment settings (not in git):

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy and remote D1 migrations from agents |
| `SUPERADMIN_PASSWORD` | Local/preview superadmin login |
| `SES_ACCESS_KEY` / `SES_SECRET_KEY` | OTP email (local dev logs OTP when unset) |
| `SENDY_URL` / `SENDY_LIST_ID` | Newsletter form |
| `GA4_ID` | Analytics reference |

Production deploy from an agent with `CLOUDFLARE_API_TOKEN` set:

```bash
bash scripts/production-deploy.sh
```
