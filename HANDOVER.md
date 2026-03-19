# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 141/200 lines — OK**
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

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ⚠️ (CF Pages에 추가 필요)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ACTIVE STEP: none — C3 complete ────────

**Next step: C4** — Site Architecture. Read `SPEC.md §C4` before starting.

**Revenue model (confirmed 2026-03-18):** AdSense (C8–C9) + long-term B2B direct ad sales to game publishers/developers. marketing-skills/ selection reflects both directions.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-B5 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
_2026-03-16~18 B-series + C1/C2 entries → HANDOVER-archive.md_
| 2026-03-18 | UI: PLAYFIT wordmark logo on /privacy and /terms — links to home | `privacy/page.tsx`, `terms/page.tsx`, `legal.module.css` |
| 2026-03-18 | UI: Steam CDN thumbnails on result cards — left-side row, 200px desktop / 130px mobile, full image visible; preconnect added | `result/page.tsx`, `result/page.module.css`, `layout.tsx` |
| 2026-03-18 | UI: Metacritic score label + color tiers (≥75 green, 50–74 amber, <50 red) | `result/page.tsx`, `result/page.module.css` |
| 2026-03-18 | Fix: search debounce 300ms → 150ms; race condition fixed via searchGenRef (stale responses discarded) | `page.tsx` |

---

## ── COMPLETED STEPS ──────────────────────────────────────

### ✅ B8–B10 — 2026-03-18 — E2E manual test checklists
- File: `TEST_B8_B10.md`
- B8: email login → link Steam → recommend → feedback → return visit
- B9: Steam login → auto recommend → feedback persistence
- B10: non-auth → full flow → weights by steam_id (+ optional migration step)
- Build: `tsc --noEmit` passed ✅

### ✅ B7 — 2026-03-16~17 — Header + login modal + auth system
- Files: `Header.tsx`, `Header.module.css`, `page.tsx`, `page.module.css`, `reset-password/page.tsx`
- Auth: email+**password** login/signup; OTP for signup verification only (`verifyOtp({ type: 'signup' })`); forgot password → /reset-password
- Google: GIS + `signInWithIdToken` + `renderButton()` (FedCM-free); Steam: OpenID popup
- Header: 3 auth states; Steam link popup (auto-open after non-Steam login)
- page.tsx: Steam auth → hides URL input; linked → pre-fills URL
- Build: `tsc --noEmit` passed ✅

### ✅ B6 — 2026-03-16 — /api/feedback session-aware
- Files: `app/api/feedback/route.ts`
- Changes: `createServerClient` reads session; feedback insert includes `user_id`; weights upsert on `user_id,tag` (logged-in) or `steam_id,tag` (anon)
- Build: `tsc --noEmit` passed ✅

### ✅ B5 — 2026-03-16 — /api/recommend four auth cases
- Files: `app/api/recommend/route.ts`, `lib/supabase.ts`
- Changes: `createServerClient` reads session; weights by `user_id` (Cases 1–3, logged in) or `steam_id` (Case 4, anon); `getUserTagWeights` gains `by` param
- Build: `tsc --noEmit` passed ✅

### ✅ B4 + B4-link — 2026-03-16 — Steam OpenID auth
- Files: `app/api/auth/steam/route.ts`, `app/api/auth/steam/callback/route.ts`, `app/api/auth/link-steam/route.ts`
- Decisions: `generateLink({ type: 'magiclink' })` → redirect to action_link → session set via existing `/api/auth/callback`
- Build: `tsc --noEmit` passed ✅

- B3 archived → see HANDOVER-archive.md
- B1+B2 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
