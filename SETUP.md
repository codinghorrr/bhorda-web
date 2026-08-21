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

If `--remote` fails with **`7403` / “account is not valid or is not authorized”**:

1. Confirm you are logged into the Cloudflare account that owns D1 `sevatirth-bhorda`:
   ```bash
   npx wrangler login
   npx wrangler d1 list
   ```
2. Ensure `account_id` in `wrangler.toml` matches that account (Wrangler caches it after login).
3. For CI/agents, set **`CLOUDFLARE_API_TOKEN`** with **Account → D1 → Edit** (and Workers) permissions, plus **`CLOUDFLARE_ACCOUNT_ID`** in environment secrets.
4. Check migration status without applying:
   ```bash
   npx wrangler d1 migrations list sevatirth-bhorda --remote
   ```
   `No migrations to apply!` means production D1 is already up to date.

Migration `0007_remove_test_manager.sql` removes the development-only `manager.test@sevatirthbhorda.org` account seeded in `0002`. Integration tests re-insert that user in test setup only.

## Worker secrets

Secrets enforced at deploy time are listed in `wrangler.toml` under `[secrets].required`. Do not put values in the Wrangler file or in git.

Set **required** production secrets before the first deploy:

```bash
npx wrangler secret put SUPERADMIN_PASSWORD
npx wrangler secret put SES_ACCESS_KEY
npx wrangler secret put SES_SECRET_KEY
```

Optional integrations (set when ready — the site works without them):

```bash
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

The zone must already sit on the same Cloudflare account. Deploy after the **required** secrets and the D1 id are in place:

```bash
npx wrangler types
npm run deploy
```

If **`npm run deploy`** fails with **`10000` / Authentication error** on `/workers/services/sevatirth-bhorda`:

Your `CLOUDFLARE_API_TOKEN` can read D1 but is missing **Workers deploy** permissions. D1-only tokens can run `d1 list` / migrations yet still fail deploy.

1. Create a new token at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) (or edit the existing one).
2. Use **Edit Cloudflare Workers** template, or add these permissions manually:
   - **Account** → Workers Scripts → **Edit**
   - **Account** → Workers R2 Storage → **Edit** (R2 media bucket)
   - **Account** → D1 → **Edit**
   - **Account** → Workers Tail → **Read** (optional, logs)
   - **Zone** → **sevatirthbhorda.org** → Workers Routes → **Edit** (custom domains in `wrangler.toml`)
   - **User** → User Details → **Read** (helps `wrangler whoami`)
3. Set **`CLOUDFLARE_ACCOUNT_ID`** to the account that owns the Worker and D1 (Dashboard → Workers → account id in the sidebar).
4. Update the **`CLOUDFLARE_API_TOKEN`** secret in Cursor Cloud Agent settings (or export locally), then retry:
   ```bash
   npm run deploy
   ```

You cannot run `wrangler login` while `CLOUDFLARE_API_TOKEN` is set — unset it first if you prefer OAuth instead of an API token.

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
| `CLOUDFLARE_API_TOKEN` | Wrangler **deploy** + remote D1 — needs Workers Scripts **Edit**, D1 **Edit**, R2 **Edit**, and zone Workers Routes **Edit** (see deploy troubleshooting above) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id (avoids Wrangler picking the wrong account) |
| `SUPERADMIN_PASSWORD` | Local/preview superadmin login |
| `SES_ACCESS_KEY` / `SES_SECRET_KEY` | OTP email (local dev logs OTP when unset) |
| `SENDY_URL` / `SENDY_LIST_ID` | Newsletter form (optional) |
| `GA4_ID` | Analytics reference (optional) |

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
