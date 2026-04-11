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
| Writing ANY text to this file | **English by default** — Korean only when genuinely necessary |

Full writing rules → `rules/handover-rules.md`

---

## ── WORKSPACE CRASH PREVENTION ────────────────────────────

**NEVER `npm run build` or `npm run dev` — instant OOM crash / banned.** Use `npx tsc --noEmit` for type-check only. Testing = `git push` → Cloudflare Pages deploy → user tests in browser.

---

## ── IN-PROGRESS LOCK ──────────────────────────────────────

**Check this first. If filled, a previous session was interrupted — resume from here.**

```
STATUS: clear
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
| 1–10, A1–A10 | MVP + Supabase + Claude tags | ✅ 2026-03-13–16 |
| B1–B10 | Auth: Google OAuth, Steam OpenID, email+pw | ✅ 2026-03-16 |
| C1–C13 | SEO, legal, GA4, architecture, game/genre/blog, AdSense | ✅ 2026-03-18–20 |
| FT1–FT7 | Preview strip, genre/blog UX, save system | ✅ 2026-03-21–23 |
| S1–S5 + bugfixes | Home polish, settings page, auth bugs, library picker | ✅ 2026-03-27–28 |
| CE-1 | Mobile: Saved Games touch panel | ✅ 2026-03-31 |
| CE-2 | Library picker: show for unlinked_auth + valid URL | ✅ 2026-03-31 |
| CE-3 | Library picker: fetch timeout + retry button | ✅ 2026-03-31 |
| CE-4 | Feedback buttons: vote change + error on failure (resolves CE-7) | ✅ 2026-04-06 |
| CE-5 | Result page: save toggle on each card | ✅ 2026-04-06 |
| CE-6 | Steam header btn (unlinked_auth) + one-time popup on first login (localStorage) + benefit copy in dropdown | ✅ 2026-04-08 |
| CE-8 | /games/[appid]: back nav — Breadcrumb sufficient, no separate link added | ✅ 2026-04-08 |
| CE-9 | /genre page: recommendation CTA at bottom | ✅ 2026-04-08 |
| CE-10 | Remove "커뮤니티 기능 곧 출시" placeholder | ✅ 2026-04-08 |
| CE-11 | Anon Steam URL mode: "feedback won't save" notice | ✅ 2026-04-08 |
| CE-12 | Unify submit button text | ✅ 2026-04-11 |
| CE-13 | Saved games: image load failure fallback | ✅ 2026-04-11 |
| CE-14 | Result cards: reduce animation stagger 80ms → 40ms | ✅ 2026-04-11 |
| CE-15 | Steam linking: value proposition copy in dropdown | ✅ 2026-04-08 (resolved by CE-6) |
| CE-16 | Skeleton UI on page transitions (deferred, post CE-series) | ⏳ |
| CE-17 | SaveToggle: error message not persistent (disappears after 2s) | ⏳ |
| CE-18 | LibraryPickerModal: confirm button scrolls off screen | ✅ already implemented |
| CE-19 | Header login modal: no focus trap | ⏳ |
| CE-20 | Header: password reset confirmation dead end | ✅ already implemented |
| CE-21 | RecommendationForm: game search API silent fail | ⏳ |
| CE-22 | SavedGames: keyboard focus-blur immediately closes panel | ⏳ |
| CE-23 | SavedGames: skeleton loading no accessible label | ⏳ |
| CE-24 | LibraryPickerModal: game row touch target below 44px | ⏳ |
| CE-25 | Header: hamburger button missing aria-label | ✅ already implemented |
| CE-26 | RecommendationForm: submit button enables on any URL text | ⏳ |
| CE-27 | RecommendationForm: focus not moved to error on submit failure | ⏳ |
| CE-28 | RecommendationForm: manual mode submit blocked with no explanation | ⏳ |
| CE-29 | RecommendationForm: linked Steam account not identified | ⏳ |
| CE-30 | RecommendationForm: budget placeholder text is redundant | ⏳ |
| CE-31 | RecommendationForm: search result count not announced | ⏳ |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅ · `saved_games` ✅ · `recommendation_sets` ✅

---

## ── ACTIVE STEP: CE-17 — SaveToggle: error message disappears before user notices ──

**Problem:** `app/result/[id]/SaveToggle.tsx` — save failure error clears via `setTimeout(..., 2000)`. User may miss it and assume save succeeded.

**Files:** `app/result/[id]/SaveToggle.tsx`

**Spec:**
- Remove the `setTimeout` that clears `errorMsg`
- Instead, clear `errorMsg` at the start of the next save attempt (before the fetch)
- Result: error stays visible until the user tries again

**Out of scope:** Changing success state behavior; adding toast infrastructure.

**After completing:** clear lock → add Completed Step entry → set CE-19 as Active Step (copy spec from SPEC.md §CE-19)

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 entries → HANDOVER-archive.md §Minor Changes Log 2026-03-28_
_2026-03-29 entries (early) → HANDOVER-archive.md §Minor Changes Log 2026-03-29_
_2026-03-29 (late) – 2026-03-31 entries → HANDOVER-archive.md §Minor Changes Log 2026-03-29 (late) to 2026-03-31_
_2026-04-06 entries (CE-4, CE-5) → HANDOVER-archive.md §Minor Changes Log 2026-04-06_

| Date | Change | Files |
|------|--------|-------|
| 2026-04-08 | feat(CE-6): remove Steam link popup auto-trigger; add benefit hint copy in dropdown | Header.tsx, Header.module.css |
| 2026-04-08 | feat(CE-6 rev): Steam header btn (unlinked_auth only) + one-time popup logic restored via localStorage; CE-15 resolved | Header.tsx, Header.module.css |
| 2026-04-08 | refactor(CE-8): remove ← 홈으로 back link — Breadcrumb already provides home nav | games/[appid]/page.tsx, page.module.css |
| 2026-04-08 | feat(CE-9): recommendation CTA at bottom of /genre (inside genres>0 branch) | genre/page.tsx, genre/page.module.css |
| 2026-04-08 | ux(CE-10): remove "커뮤니티 기능 곧 출시" placeholder section + CSS classes | games/[appid]/page.tsx, page.module.css |
| 2026-04-08 | ux(CE-11): add "피드백 저장 안 됨" notice in Steam URL mode for anon/unlinked_auth | RecommendationForm.tsx |
| 2026-04-11 | ux(CE-12): unify submit button text → '게임 추천받기' | RecommendationForm.tsx |
| 2026-04-11 | ux(CE-13): saved games image fallback — show game name when image fails | SavedGames.tsx, page.module.css |
| 2026-04-11 | ux(CE-14): result card stagger delay 80ms → 40ms | result/[id]/page.module.css |
| 2026-04-11 | ux(CE-13 polish): fallback — stripe bg, text-secondary, line-clamp, overlay display:none | page.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1–B10, C1–C13, FT1–FT7, S1–S5 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
CE-series full spec → `SPEC.md §Phase CE`
AdSense activation → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec archive → `SPEC_archive.md`
