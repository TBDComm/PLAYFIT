# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 147/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see rules/handover-rules.md §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

| Situation | Action |
|-----------|--------|
| Starting any work | Fill In-Progress Lock immediately |
| Completing a step | Clear lock → add Completed Step entry → update Active Step |
| Non-step change (bug, config, style) | Clear lock → add Minor Changes Log entry |
| Session interrupted | Leave lock filled — next session resumes from it |
| Writing ANY text to this file | **English by default** — Korean only when genuinely necessary (Korean-specific context, UI label references). Do not default to Korean out of habit. |

Full writing rules → `rules/handover-rules.md`

---

## ── WORKSPACE CRASH PREVENTION ────────────────────────────

**NEVER `npm run build` or `npm run dev` — instant OOM crash / banned.** Use `npx tsc --noEmit` for type-check only. Testing = `git push` → Cloudflare Pages deploy → user tests in browser.

`next dev` auto-start disabled via `.idx/dev.nix`. If firebase/nixd running: `kill $(pgrep -f firebase) $(pgrep -f nixd) 2>/dev/null`. If VM crashes → RESTART workspace.

---

## ── IN-PROGRESS LOCK ──────────────────────────────────────

**Check this first. If filled, a previous session was interrupted — resume from here.**

```
STATUS: CLEAR
```

_When starting work, replace above with:_
```
STATUS: IN PROGRESS
Step: [N — name, or "non-step: description"]
Files touched: []
Stopped at: [update continuously]
Next action: [exactly what to do next to resume]
```

---

## ── CURRENT STATUS ───────────────────────────────────────

| Step | Description | Status |
|------|-------------|--------|
| 1–10 | Original MVP | ✅ |
| A1–A10 | Supabase DB, tag-based Claude, manual mode, search, E2E tests | ✅ 2026-03-13–16 |
| A7-1 | Korean game name search — removed (Steam API returns empty server-side) | ❌ 2026-03-16 |
| B1 | Create `user_profiles` table | ✅ 2026-03-16 |
| B2 | Alter `user_tag_weights` + `feedback` (add user_id, keep steam_id) | ✅ 2026-03-16 |
| B3 | Google auth — Header, login modal, auth callback, logout | ✅ 2026-03-16 |
| B4 | Steam OpenID — `/api/auth/steam` + callback | ✅ 2026-03-16 |
| B4-link | `/api/auth/link-steam` — Steam URL → migrate weights to user_id | ✅ 2026-03-16 |
| B5 | Update `/api/recommend` — all four auth cases | ✅ 2026-03-16 |
| B6 | Update `/api/feedback` — user_id if session, steam_id if not | ✅ 2026-03-16 |
| B7 | Update Header (Steam link button) + main page layout per auth state | ✅ 2026-03-16 |
| B8–B10 | E2E tests (email, Steam, non-auth) | ✅ |
| C1 | SEO foundation — robots.ts, sitemap.ts, OG/Twitter meta tags | ✅ 2026-03-18 |
| C2 | Legal pages — /privacy, /terms, Footer component | ✅ 2026-03-18 |
| C3 | GA4 Analytics — gtag.js + 5 events | ✅ 2026-03-19 |
| C4 | Site Architecture — Breadcrumb, /genre index, /users/[userId] reserved (nav bar subsequently removed — no sticky bar anywhere; auth buttons float top-right in Header.tsx) | ✅ 2026-03-20 |
| C5 | Game detail pages `/games/[appid]` — ISR 86400s, similar games TOP 10, SEO, noindex guard | ✅ 2026-03-20 |
| C6 | Genre hub pages `/genre/[slug]` — ISR 86400s, top 20 by tag sum, ItemList JSON-LD, community placeholder | ✅ 2026-03-20 |
| C7 | Blog section `/blog` + `/blog/[slug]` — TSX content components, BlogPosting JSON-LD, sitemap updated | ✅ 2026-03-20 |
| C8 | AdSense script (`layout.tsx`), `AdUnit.tsx` component, `ads.txt` placeholder — Publisher ID pending AdSense approval | ✅ 2026-03-20 |
| C9 | Ad placement — game detail (after similar games), genre hub (after item 10), blog post (end of post), result (below cards), blog index (below fold) | ✅ 2026-03-20 |
| C10 | Schema Markup — JsonLd.tsx component; @graph on all pages: WebApplication+Organization+WebSite (main), SoftwareApplication+BreadcrumbList (game), ItemList+BreadcrumbList (genre), BlogPosting+BreadcrumbList (blog) | ✅ 2026-03-20 |
| C11 | On-Page SEO — meta title templates (main/blog post fixed), H1 logo GUILDELINE fix, blog internal links to /genre + / | ✅ 2026-03-20 |
| C12 | AI SEO — FAQ block on game pages, definition block on genre pages, dateModified in all schemas, updatedAt on blog posts | ✅ 2026-03-20 |
| C13 | Core Web Vitals — `<Image unoptimized>` (CF Pages constraint), `requestIdleCallback` for analytics (INP), ad minHeight wrapper (CLS) | ✅ 2026-03-20 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳ (pending AdSense approval — add to CF Pages when Publisher ID received)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ADSENSE ACTIVATION CHECKLIST (run after FT-series + approval) ────────

**Apply for AdSense AFTER FT-series is fully complete.** When approval email arrives, do these in order:

1. **CF Pages env var** — add `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX`
2. **`public/ads.txt`** — uncomment line, replace `pub-XXXXXXXXXXXXXXXX` with real Publisher ID
3. **Ad slot IDs** — replace all `slot="0000000000"` with real slot IDs from AdSense dashboard:
   - `app/games/[appid]/page.tsx` — "game detail" slot
   - `app/genre/[slug]/page.tsx` — "in-list" slot
   - `app/blog/[slug]/page.tsx` — "in-article" slot
   - `app/blog/page.tsx` — "display" slot
   - `app/result/page.tsx` — "display" slot
4. Deploy → verify ads appear on each page type

---

## ── ACTIVE STEP: FT-series — Product Experience ─────────

Full audit completed 2026-03-20. Spec written in `SPEC.md §Phase 6`. Design identity saved in `memory/project_design_identity.md`.

**Naming note:** SPEC.md contains legacy "D-series" references (community hub hooks, user profile placeholders) from C-series implementation. These refer to the user's separately planned community feature phase — a different plan not yet documented here. FT-series is independent of that. Do NOT conflate the two.

**FT-series order (implement in this sequence):**
1. **FT5** — quick fixes: Intl.DateTimeFormat in blog/page.tsx, CSS comment "PLAYFIT"→"GUILDELINE" (3 files)
2. **FT3** — Footer: add nav row (홈 · 장르별 탐색 · 블로그) above legal links
3. **FT1** — Main page hero redesign: TagScatter + headline + stats + preview cards + How it works
4. **FT2** — Genre index: game counts per genre, sort by count, tier chips
5. **FT4** — 2 new blog posts (reach 5 total for AdSense)

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-2026-03-20 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-20 | Fix: `export const runtime = 'edge'` required on all dynamic `[param]` routes | `games/[appid]/page.tsx`, `genre/[slug]/page.tsx`, `users/[userId]/page.tsx` |
| 2026-03-20 | Fix: blog/[slug] — remove generateStaticParams (incompatible with edge runtime) | `app/blog/[slug]/page.tsx` |
| 2026-03-20 | Rename: PlayFit → Guildeline; `@steam.playfit` + sessionStorage keys unchanged (internal identifiers) | all tsx/ts/md |
| 2026-03-20 | feat: LoadingOverlay (G logo pulse + bouncing dots) on main page; Toast notification on Steam link success | LoadingOverlay.tsx/.css, page.tsx, Header.tsx/.css |
| 2026-03-20 | ui: muted "Steam 연동됨" text shown in header for email/Google users with Steam already linked | Header.tsx, Header.module.css |
| 2026-03-20 | feat(C12): FAQ block (game pages), definition block (genre pages), dateModified schema (all), updatedAt support (blog) | games/[appid]/, genre/[slug]/, blog/[slug]/, lib/blog.ts |
| 2026-03-20 | feat(C13): `<img>` → `<Image unoptimized>` + failedImages state; analytics defer to requestIdleCallback (Safari fallback: setTimeout 0) | result/page.tsx, lib/analytics.ts |
| 2026-03-20 | Domain: guildeline.com live — CF Pages, NEXT_PUBLIC_BASE_URL, Google Console JS Origins, Supabase Auth URL, Search Console, GA4 all updated | external services |
| 2026-03-20 | feat(FT5): Intl.DateTimeFormat in blog/page.tsx; CSS comment PLAYFIT→GUILDELINE (3 files) | app/blog/page.tsx, app/globals.css, app/page.module.css, app/result/page.module.css |
| 2026-03-20 | feat(FT3): Footer nav row added (홈 · 장르별 탐색 · 블로그) above legal links | app/components/Footer.tsx |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
