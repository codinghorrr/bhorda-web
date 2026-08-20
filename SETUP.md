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

Migration `0007_remove_test_manager.sql` removes the development-only `manager.test@sevatirthbhorda.org` account seeded in `0002`. Integration tests re-insert that user in test setup only.

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

| Secret | Purpose | Required at launch? |
|---|---|---|
| `SUPERADMIN_PASSWORD` | Break-glass Superadmin login (`hello@axiso.com.au`) | **Yes** |
| `SES_ACCESS_KEY` | Amazon SES access key for OTP / staff email | **Yes** |
| `SES_SECRET_KEY` | Amazon SES secret key | **Yes** |
| `SENDY_URL` | Sendy install base URL (newsletter form) | No — shows “coming soon” until configured |
| `SENDY_LIST_ID` | Sendy list id for the site subscribe form | No — shows “coming soon” until configured |
| `GA4_ID` | Google Analytics 4 measurement id (reference in admin UI) | No — analytics snippet optional in Site Settings |

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

Local dev without real SES logs OTP codes to the `wrangler dev` console.

Before deploy, run `npm run typecheck` and `npm test`.


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
npm run typecheck
npm test
bash scripts/production-deploy.sh
```

## Push to GitHub

The canonical remote today is **Origin**: `https://origin.cursor.com/git/axiso/bhorda-web.git` (branch `main` is up to date).

To mirror on **GitHub** (`github.com/codinghorrr/bhorda-web`):

1. Create a [GitHub personal access token](https://github.com/settings/tokens) with **`repo`** scope.
2. Add it to Cloud Agent secrets as **`GH_TOKEN`**, or export it locally.
3. Run:

```bash
GH_TOKEN=ghp_... bash scripts/push-to-github.sh
```

This creates the GitHub repo if missing, adds a `github` remote, and pushes **`main`**, all branches, and tags (including `v1.0`).
