# Launch checklist — sevatirthbhorda.org v1.0

Production deploys go directly to `main` (PRD §12). Complete these steps after the v1.0 tag is pushed.

## 1. Sendy + SES provisioning

**Current status:** Sendy is **not** configured in this environment (`SENDY_URL` points to `example.invalid`). The site shows **“Newsletter signup coming soon”** in the header and footer instead of the subscribe form.

When Sendy and SES are ready:

```bash
npx wrangler secret put SENDY_URL      # e.g. https://newsletter.example.com/sendy
npx wrangler secret put SENDY_LIST_ID  # Sendy list id from your install
```

After secrets are set, redeploy (`npm run deploy`). The subscribe form appears and `POST /api/newsletter/subscribe` proxies to `{SENDY_URL}/subscribe` with rate limiting.

SES is used for admin OTP email (`SES_ACCESS_KEY`, `SES_SECRET_KEY`, `SES_REGION`, `SES_FROM_EMAIL`).

## 2. Database migrations (production D1)

Apply all migrations including launch content and the test-manager cleanup:

```bash
npm run db:migrate:remote
```

Migration `0007_remove_test_manager.sql` ensures `manager.test@sevatirthbhorda.org` is not present in production.

Migration `0006_launch_content.sql` seeds About, Activities, Sanskar, home blocks, sample spotlight events, and gallery videos.

## 3. Production routes

`wrangler.toml` binds:

| Route | Role |
|---|---|
| `sevatirthbhorda.org` | Canonical apex |
| `www.sevatirthbhorda.org` | 301 redirect to apex |

Deploy:

```bash
npm run typecheck
npm test
npm run deploy
```

Verify:

```bash
curl -sI https://www.sevatirthbhorda.org/ | grep -i location
# Location: https://sevatirthbhorda.org/

curl -sI https://sevatirthbhorda.org/health
```

## 4. Google Search Console — sitemap submission (manual)

**Operator action:** submit the sitemap in [Google Search Console](https://search.google.com/search-console).

1. Add property **`https://sevatirthbhorda.org`** (URL-prefix or domain property) if not already verified.
2. Open **Sitemaps** in the left menu.
3. Under **Add a new sitemap**, enter exactly:

   ```
   sitemap.xml
   ```

   (GSC prepends the property URL — the full submitted URL is **`https://sevatirthbhorda.org/sitemap.xml`**.)

4. Click **Submit**.
5. Confirm status shows “Success” after Google fetches it (may take hours).

Optional checks before submitting:

```bash
curl -sS https://sevatirthbhorda.org/sitemap.xml | head
curl -sS https://sevatirthbhorda.org/llms.txt | head
```

## 5. Post-launch QA (human)

- [ ] Browse every primary nav item in `/en` and `/gu`
- [ ] Test language switch on Home, Events, Gallery, and one Activity page
- [ ] Submit a contact/donation interest form; confirm it appears in `/vedmata/submissions`
- [ ] Mobile check: Home, Events, Gallery, Activities → Yagya
- [ ] Newsletter: confirm form or “coming soon” as expected for Sendy status
- [ ] Admin: log in at `/vedmata`, spot-check Analytics Dashboard

Automated coverage: `npm test` includes `test/launch-qa.test.ts` (bilingual routes, hreflang, www redirect, seeded content).

## 6. Analytics (optional at launch)

Superadmin → **Site Settings** (`/vedmata/settings`):

- Paste GA4 snippet and enable toggle, and/or
- Enable Cloudflare Web Analytics with beacon token

On-site page views are always recorded in D1 for the Analytics Dashboard.
