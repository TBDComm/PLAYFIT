# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 134/200 lines — OK**
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
| **CE-1** | **Mobile: Saved Games touch panel** | **▶ NEXT** |
| CE-2 | Library picker: show for unlinked_auth + valid URL | ⏳ |
| CE-3 | Library picker: fetch timeout + retry button | ⏳ |
| CE-4 | Feedback buttons: vote change + error on failure (resolves CE-7) | ⏳ |
| CE-5 | Result page: save toggle on each card | ⏳ |
| CE-6 | Steam link popup: remove auto-trigger + add benefit copy | ⏳ |
| CE-8 | /games/[appid]: back navigation | ⏳ |
| CE-9 | /genre page: recommendation CTA at bottom | ⏳ |
| CE-10 | Remove "커뮤니티 기능 곧 출시" placeholder | ⏳ |
| CE-11 | Anon Steam URL mode: "feedback won't save" notice | ⏳ |
| CE-12 | Unify submit button text | ⏳ |
| CE-13 | Saved games: image load failure fallback | ⏳ |
| CE-14 | Result cards: reduce animation stagger 80ms → 40ms | ⏳ |
| CE-15 | Steam linking: add value proposition copy in dropdown | ⏳ |
| CE-16 | Skeleton UI on page transitions (deferred, post CE-series) | ⏳ |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅ · `saved_games` ✅ · `recommendation_sets` ✅

---

## ── ACTIVE STEP: CE-1 — Mobile: Saved Games touch panel ──

**Full spec** → `SPEC.md §CE-1` (copied inline below)

**Problem:** `SavedGames.tsx:65-100` — floating detail panel activates on `mouseenter` only. Touch users cannot see game details (reason, price, Metacritic) or unsave.

**Files:** `app/components/SavedGames.tsx`, `app/page.module.css`

**Spec:**
- On card interaction: if `event.pointerType === 'touch'` → tap-toggle behavior; if mouse → existing hover unchanged
- On tap: open panel (same `handleCardEnter` logic). Stays open until: tap outside, tap another card, or tap "저장 취소"
- Add transparent backdrop `<div>` (position fixed, inset 0, z below panel) rendered when panel is open on touch → `onClick` dismisses
- Add `aria-expanded` on each card toggled by touch state
- Desktop hover: unchanged

**Out of scope:** Redesigning panel layout for mobile.

**After completing:** clear lock → add Completed Step → set CE-2 as Active Step (copy spec from SPEC.md §CE-2)

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 entries → HANDOVER-archive.md §Minor Changes Log 2026-03-28_
_2026-03-29 entries (early) → HANDOVER-archive.md §Minor Changes Log 2026-03-29_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-29 | ux: feedback buttons → right-side column, +/- square buttons, hint label vertical text | result/[id]/FeedbackButtons.tsx, feedback.module.css, page.tsx, page.module.css |
| 2026-03-29 | fix: feedback.module.css prefers-reduced-motion + hint font 0.6→0.65rem | result/[id]/feedback.module.css |
| 2026-03-29 | ux: feedback buttons fill column (flex:1, width:80px), hint label removed | result/[id]/FeedbackButtons.tsx, feedback.module.css |
| 2026-03-29 | ux: feedback notice above results + footer feedback box with accent border | result/[id]/page.tsx, page.module.css |
| 2026-03-29 | ux: card layout refinement — name 1.15rem, divider, reason 0.875rem/1.6, storeLink text-only, MC label | result/[id]/page.tsx, page.module.css |
| 2026-03-29 | ux: storeLink color → Steam blue #66c0f4 | result/[id]/page.module.css |
| 2026-03-29 | ux: reason+tags → .cardMiddle (margin auto top/bottom) — vertically centered | result/[id]/page.tsx, page.module.css |
| 2026-03-30 | fix: NO_GAMES_IN_BUDGET false positive — include price-unknown games in candidates (remove price_updated_at guard, add null check in budget filter) | types/index.ts, generate-recommendation/route.ts |
| 2026-03-30 | fix(a11y): prefers-reduced-motion missing in LibraryPickerModal + legal.module.css; revert unnecessary NO_GAMES_IN_BUDGET else branch | LibraryPickerModal.module.css, legal.module.css, RecommendationForm.tsx |
| 2026-03-30 | fix(algo): tagProfile 이중 voteCount 제거 (√playtime 전용) + scoreCandidates 후보 풀 80→300 | generate-recommendation/route.ts |
| 2026-03-30 | ux: price-unknown → Steam link; playtime placeholder 예: 50…; home MC label 통일 | result/[id]/page.tsx, page.module.css, RecommendationForm.tsx, page.tsx |
| 2026-03-30 | ux: Metacritic label → "Metacritic Score XX" (전체 통일: result, home, SavedGames) | result/[id]/page.tsx, page.tsx, SavedGames.tsx |
| 2026-03-30 | fix(a11y): priceUnknown — :focus-visible + prefers-reduced-motion 누락 수정 | result/[id]/page.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1–B10, C1–C13, FT1–FT7, S1–S5 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
CE-series full spec → `SPEC.md §Phase CE`
AdSense activation → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec archive → `SPEC_archive.md`
