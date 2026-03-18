# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 151/200 lines — OK**
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

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ACTIVE STEP: none — C2 complete ────────

**Next step: C3** — GA4 Analytics Setup. Read `SPEC.md §C3` before starting.

**Revenue model (confirmed 2026-03-18):** AdSense (C8–C9) + long-term B2B direct ad sales to game publishers/developers. marketing-skills/ selection reflects both directions.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-B5 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
_2026-03-16~17 entries → HANDOVER-archive.md_
| 2026-03-18 | B8–B10: E2E manual test checklists — email/Steam/non-auth paths | `TEST_B8_B10.md` |
| 2026-03-18 | Fix: missing `…` on password field placeholders (2 fields) | `Header.tsx`, `reset-password/page.tsx` |
| 2026-03-18 | Fix: Google login FedCM error — remove `prompt()`, replace with `renderButton()`; remove GoogleIcon | `Header.tsx`, `Header.module.css` |
| 2026-03-18 | Fix: dead code — merge duplicate steamBtn CSS, add showOAuth to useEffect deps, move declaration above effects | `Header.tsx`, `Header.module.css` |
| 2026-03-18 | Fix: detect duplicate email signup — identities.length===0 check, show Google account error message | `Header.tsx` |
| 2026-03-18 | Fix: link-steam migration silent fail — replace update() with fetch→merge(avg)→upsert→delete to handle duplicate tag conflicts | `link-steam/route.ts` |
| 2026-03-18 | Perf: link-steam step 3 + step 5 DB queries now run in parallel (both only need steamId) | `link-steam/route.ts` |
| 2026-03-18 | Dead code: remove GAME_NOT_FOUND (never returned by any API route) | `types/index.ts`, `page.tsx` |
| 2026-03-18 | Fix: Steam OpenID — `includes('is_valid:false')` → `!includes('is_valid:true')` (auth bypass on Steam outage) | `steam/callback/route.ts` |
| 2026-03-18 | Fix: handleLinkSteam — add try-catch-finally so linkLoading clears on network error | `Header.tsx` |
| 2026-03-18 | Fix: debounce delay 0ms → 300ms (was firing search on every keystroke, race condition) | `page.tsx` |
| 2026-03-18 | Fix: --bg-base (undefined variable) → --bg in reset-password | `reset-password/page.module.css` |
| 2026-03-18 | Responsive: mobile media queries + 100dvh + iOS zoom fix (font-size 16px) across all pages | `globals.css`, `Header.module.css`, `page.module.css`, `result/page.module.css`, `reset-password/page.module.css` |
| 2026-03-18 | C-series spec defined — C1–C13 (AdSense monetization) added to SPEC.md; marketing-skills/ repo copied | `SPEC.md`, `marketing-skills/` |
| 2026-03-18 | C4 /users/[userId] community URL reserved; C5/C6 programmatic-SEO guidelines reflected (thin content guard, community placeholder) | `SPEC.md` |
| 2026-03-18 | marketing-skills/ pruned — 33 → 22 skills; removed 12 (7 permanent, 5 deferred to B2B ad sales phase) | `marketing-skills/REMOVED.md` |
| 2026-03-18 | C1: robots.ts (dynamic, reads NEXT_PUBLIC_BASE_URL), sitemap.ts (static routes + genre slugs from DB), layout.tsx (metadataBase, canonical, OG/Twitter tags) | `app/robots.ts`, `app/sitemap.ts`, `app/layout.tsx` |
| 2026-03-18 | C2: /privacy + /terms (Korean legal pages), Footer component (privacy · terms · © 2026), Footer added to layout.tsx | `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/components/Footer.tsx`, `app/components/Footer.module.css`, `app/legal.module.css`, `app/layout.tsx` |
| 2026-03-18 | Fix: ESLint react/no-unescaped-entities in terms/page.tsx ("서비스", "as-is") — build was failing | `app/terms/page.tsx` |
| 2026-03-18 | UI: remove header banner — login/logout/Steam-link buttons moved to fixed top-right floating | `Header.tsx`, `Header.module.css` |

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
