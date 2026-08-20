# PRD — Gayatri Kamdhenu Sevatirth Website
**sevatirthbhorda.org**

Version 1.0 · Consolidated from planning discussion · Status: Ready for build

---

## 1. Summary

A bilingual (English/Gujarati) informational website for Gayatri Kamdhenu Sevatirth, Bhorda — covering the organization's story, its activities (Gaushala, Gurukul, Mavtardham, and more), an events/gallery system, learning resources, and contact/donation-interest capture. No online payments anywhere on the site. Built on Cloudflare Workers + D1, maintained day-to-day by non-technical staff through a purpose-built, minimal admin panel.

**Repository:** `bhorda` (GitHub) · **Branch strategy:** all work pushed to `main` · **Domain:** `sevatirthbhorda.org` (production, from day one — no separate staging domain)

---

## 2. Goals

1. Present the organization's story, mission, and activities clearly, in both English and Gujarati, with the Gujarati experience being a first-class citizen, not an afterthought.
2. Let visitors discover what's happening now (Spotlight Events), what happens regularly (Regular Schedule), and what's happened before (Gallery), without one drowning out another.
3. Give non-technical staff a genuinely learnable admin panel — content changes shouldn't require a developer.
4. Capture visitor intent (donation interest, Sanskara requests, volunteering, event interest) as structured submissions the ashram can act on manually — deliberately no online payment processing.
5. Meet modern performance, SEO, and security baselines without over-engineering for a low-traffic, mission-driven site.

## 3. Non-goals (explicitly out of scope for v1)

- Any online payment or checkout, anywhere.
- E-commerce cart/shipping for the Sahitya Stall (pickup-only catalog + request form).
- Live webinar hosting/delivery (interest form only at launch).
- Karaoke-style synced lyrics highlighting (static lyrics text alongside the audio player only).
- SMS OTP (email OTP only, unless explicitly revisited — see Assumptions).
- A staging environment separate from production (see §12, Risks — this is a deliberate trade-off you asked for, flagged once, not re-litigated).

---

## 4. Users & Roles

| Role | Who | Access |
|---|---|---|
| **Visitor** | Public | Full bilingual site, all forms, gallery, downloads |
| **Manager** | Weekly volunteer | Spotlight Events, Regular Schedule, Gallery (Photo/Audio/Video), Submissions Inbox |
| **Admin** | Occasional content owner | Everything Manager has, plus Page Text, Sahitya Stall items |
| **Superadmin** | Technical owner (`hello@axiso.com.au`) | Everything Admin has, plus user management, site settings (analytics code injection, Sendy config, security settings) |

**Authentication:**
- Manager & Admin: **email OTP only** (no password).
- Superadmin: **password only**, stored as a Cloudflare Workers secret (`.env` locally, never committed), used as a break-glass path independent of email deliverability. Same rate-limiting/lockout applies as every other login path.
- Initial Superadmin account is seeded with `hello@axiso.com.au` during setup (Phase 0/2 of the build).

**Admin panel path:** `/vedmata` (not `/admin`) — reduces automated bot scanning noise; this is obscurity, not the actual security control. Real protection is OTP + rate limiting + CSRF + RBAC below.

---

## 5. Information Architecture

**1. Home** — Hero, Gaushala/Gurukul/Mavtardham highlights, latest updates, connect CTA.

**2. About**
- Landing: brief AWGP.org affiliation statement + Mission (Vision intentionally not shown here)
- Sub-pages: Our Story (timeline infographic — see §6.2), Pandit Shriram Sharma Acharya, Vandaniya Mata Bhagwati Devi Sharma, Vedmata Gayatri, All World Gayatri Pariwar, Present Mentor of AWGP, Dr. Chinmay Pandya, Mission & Vision, Gayatri Pariwar Dabhoi

**3. Events** — three distinct streams (§6.3): Spotlight Events, Regular Schedule, and Daily Rituals (which actually lives under Activities, not here)

**4. Gallery** — Photo / Audio / Video, cross-linked to Events but independently browsable (§6.4)

**5. Activities** — Yagya, Sanskaras (16, shared template), Zhola Pustakalay, Tree Planting, Sadhana, Daily Routine/Aarti, Swadhyay, Festival Celebrations, Organic Farming, Vaccination & Medical Camps, Bal Sanskar Shala, Youth Cell, Self-Reliance Training, Games/Annual Celebration

**6. Learn & Resources** — Downloads, Reading (external links + hosted ebooks), Useful Links

**7. Contact / Donation** — contact details + donation request form (no payment)

**8. Gaushala & Gurukul** — dedicated top-level sections *(Assumption: given own nav slots rather than nested in Activities, since "dedicated section" was explicit — confirm or correct before launch)*, each with its own donation-interest form

**9. Interest Forms** — cross-cutting component, not a page; every submission lands in the Submissions Inbox

**10. Newsletter Subscribe** — header + footer, posts directly to Sendy (§6.7)

Every page exists in EN and GU, at `/en/...` and `/gu/...`, with the language switch in header and footer persisting across navigation.

---

## 6. Functional Requirements

### 6.1 Bilingual (EN/GU) behavior
- URL-prefixed: `/en/...` and `/gu/...`. Root `/` redirects based on `Accept-Language` header or a saved preference, defaulting to English.
- Language switcher in header and footer swaps the prefix on the *current* page (not back to homepage).
- `hreflang` alternate tags on every page for SEO.
- Missing Gujarati translations fall back to English content with a visible "translation pending" note, rather than a broken/empty page. *(Assumption — confirm whether translations will be ready per-page at build time or need to be produced during the build.)*

### 6.2 About → Our Story (timeline infographic)
An interactive/visual timeline component, not a plain text page:
1990 Amreshwar → 1998 Dabhoi → 1999 Pragya Puran Katha begins → 2003 Maa Bhagwati Pragya Bhavan → 2006 Shri Ram Shraddha Bhavan → 2016 Gurukul founded → 2017 Shivalaya → 2022 Bhorda land donated → 2023 108 Kundi Mahayagya.
Built as a standalone component (own layout, not the shared Page Text editor), sourced from a structured data set (year, title, description, optional image) so it can be extended in the admin without a code change (add to §6.5 Page Text scope as a special "Timeline Events" sub-editor).

### 6.3 Events — three streams
- **Spotlight Events**: one-off, dated. Fields: title, date or date range, location, description, photo, type (Event/Festival/Shibir/Katha/Medical Camp/etc.), EN/GU. Powers "Upcoming" on Home and the primary Events feed. Auto-moves to "Past" after the date.
- **Regular Schedule**: recurring, set-once. Fields: activity name, day-of-week + time, location, description. Renders on a fixed schedule without re-entry. Visually and structurally separate from Spotlight Events.
- **Daily Rituals**: not part of the Events system at all — a fixed schedule table on the Activities → Daily Routine/Aarti page.
- **Katha** is a Spotlight Event type supporting a date range (5–10 days) with day-by-day Video Gallery entries grouped and rendered as a playlist on the event's own page.

### 6.4 Gallery — Photo / Audio / Video
- **Photo**: upload → auto-resize to standard display size → compress → **discard original**. *(Assumption: originals are not retained. Flagged as one-way and reversible only before launch — confirm before this ships, since it can't be undone retroactively per photo.)* Tagged by activity and optionally by Spotlight Event.
- **Audio**: real hosting (Cloudflare R2), in-browser playback, download button, playlist grouping, and a **lyrics panel** displayed statically alongside the player (Gujarati text field + optional transliteration/English field). No synced/karaoke highlighting.
- **Video**: no API, no hosting. Admin pastes a YouTube URL, adds title/description/thumbnail (uploaded or pulled from the video). Site links out to YouTube in a new tab; never embeds the player or pulls live channel data.
- Events, Photos, Videos, and Audio are cross-linked but independently valid — none require the others.

### 6.5 Activities & Sanskaras
- Shared template for all 16 Sanskaras: name, age/timing, description, "Contact us to perform this Sanskar" button → request form → Submissions Inbox.
- Shared template for general Activities: description + relevant connect form.
- All static text editable via the Page Text admin screen (§7).

### 6.6 Learn & Resources
- Downloads: PDFs (Satsankalp, daily aarti/routine, books).
- Reading: outbound links (e.g. Vicharkranti) **and** hosted ebooks (PDF/EPUB) uploaded directly, readable/downloadable in-browser.
- Useful Links: Shantikunj, AWGP, sister centers.

### 6.7 Newsletter (Sendy)
- Plain HTML form (header + footer) posting directly to the Sendy install's `/subscribe` endpoint using Sendy's own embed snippet — no API key in site code, no admin screen, no Submissions Inbox entry (Sendy owns subscriber state).
- *(Assumption: Sendy + Amazon SES are already provisioned. If not, this is a parallel small project — hosting, SES domain verification — not blocking the rest of the build. Confirm status before Phase 6.)*

### 6.8 Donation & Sahitya Stall
- Every donation touchpoint (General, Gau Seva, Devkanya sponsorship, Seva/time donation, Anniversary/Birthday/Punyatithi) is a request form only, no payment gateway, landing in the Submissions Inbox.
- Anniversary/Birthday/Punyatithi entries additionally trigger a scheduled internal reminder (Workers Cron) emailed to staff (not the donor) a few days ahead, for manual follow-up.
- Sahitya Stall: catalog (name, price, photo, in-stock toggle) + pickup request form. No cart, no shipping, no payment.

---

## 7. Admin Panel (`/vedmata`)

Seven content screens + one cross-cutting inbox + role/site settings:

1. **Spotlight Events**
2. **Regular Schedule**
3. **Gallery — Photo** (upload → auto-process pipeline)
4. **Gallery — Audio** (upload, playlist, lyrics fields)
5. **Gallery — Video** (link-only entry, Katha playlist grouping)
6. **Sahitya Stall Items** *(Admin+)*
7. **Page Text** (shared static-content editor, including the Timeline sub-editor) *(Admin+)*
8. **Submissions Inbox** — all forms site-wide, filterable by type, mark-handled, CSV export
9. **User Management** *(Superadmin only)* — invite/manage Admin & Manager accounts
10. **Site Settings** *(Superadmin only)* — analytics code injection, Sendy config reference, security settings
11. **Analytics Dashboard** *(read-only, Admin+)* — visitor counts, top pages, top Events/Gallery items, submission volume over time

---

## 8. Data Model (D1 — high level)

```
users (id, email, role[superadmin|admin|manager], created_at)
otp_codes (id, user_id, code_hash, expires_at, used_at)
sessions (id, user_id, token_hash, expires_at)

spotlight_events (id, type, title_en, title_gu, desc_en, desc_gu, date_start, date_end, location, photo_url, status)
regular_schedule (id, name_en, name_gu, day_of_week, time, location, desc_en, desc_gu)

gallery_photo (id, url, activity_tag, event_id NULLABLE, caption_en, caption_gu)
gallery_audio (id, file_url, title_en, title_gu, composer, playlist_id, lyrics_gu, lyrics_translit)
gallery_video (id, youtube_url, thumbnail_url, title_en, title_gu, desc_en, desc_gu, event_id NULLABLE, day_number NULLABLE)
playlists (id, name_en, name_gu, type[audio|video])

stall_items (id, name_en, name_gu, price, photo_url, in_stock)

page_text (id, page_key, block_key, content_en, content_gu)
timeline_events (id, year, title_en, title_gu, desc_en, desc_gu, image_url, sort_order)

submissions (id, form_type, payload_json, submitted_at, handled, handled_by, handled_at)

site_settings (key, value) -- analytics snippets, feature flags
```

---

## 9. SEO & Performance

- Core Web Vitals (LCP/INP/CLS) as a design budget from day one: edge-rendered pages, correctly-sized images (feeds directly off §6.4's photo pipeline), preloaded fonts, minimal client JS.
- `sitemap.xml` dynamically generated from D1 content, with `hreflang` EN/GU alternates. Submitted to Google Search Console post-launch.
- `/llms.txt` and `/llms-full.txt` — auto-generated summaries for AI crawlers. Explicitly low-confidence/low-cost: no major crawler has committed to this convention yet; build it because it's cheap, not because it's guaranteed to matter.

## 10. Security

- Security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy.
- Rate limiting (Cloudflare-native) on all forms and the login endpoint.
- CSRF protection on all admin actions.
- Strict upload validation (file type/size) on photo and audio uploads.
- No secrets in source control — Workers secrets for the superadmin password, any third-party keys.
- `/vedmata` admin path (obscurity layer, not primary defense — see §4).

## 11. Analytics

- GA4 snippet + generic code-injection field, Superadmin/Admin only (Manager excluded — arbitrary script injection is a real privilege).
- Cloudflare Web Analytics offered alongside GA4 as a free, cookie-less, no-consent-banner option, given the stack is already on Cloudflare. *(Assumption: build both hooks; you decide which to actually enable.)*
- Read-only Analytics Dashboard in admin (§7.11).

---

## 12. Risks & Trade-offs (flagged once, not re-litigated)

- **Direct-to-`main`, production-domain-only workflow, no staging.** This is what you asked for, and it's workable for a small team — but it means every push is live immediately on `sevatirthbhorda.org`. Recommend at minimum: (a) a local/preview `wrangler dev` check before every push, and (b) database migrations tested against a local D1 copy before running against production. Not proposing a staging branch — just naming the trade-off so it's a choice, not a surprise.
- **Photo-original deletion is irreversible per photo.** Flagged in §6.4; confirm before Phase 3 ships if this isn't what you want.
- **Email OTP and the Sendy/SES relationship**: OTP delivery needs a transactional email sender. Since Sendy already requires Amazon SES for the newsletter, the same SES account can send OTP emails too — avoiding a second email service. This will be wired that way unless you say otherwise.

---

## 13. Assumptions Log (confirm or override anytime)

1. Gaushala & Gurukul get dedicated top-level nav slots, not nested pages within Activities.
2. Photo originals are discarded after compression (not retained in cold storage).
3. OTP delivery is via email, not SMS.
4. Gujarati translations will be supplied progressively; English is the fallback where missing.
5. Sendy + SES are assumed provisioned separately; the site just wires up the form. If not yet set up, this is called out again before Phase 6.
6. Lyrics are a plain Gujarati text field + optional transliteration field — no synced highlighting.
7. OTP transactional email reuses the same SES account as Sendy.
