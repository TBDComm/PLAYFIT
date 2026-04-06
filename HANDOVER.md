# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 148/200 lines — OK**
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
| **CE-5** | **Result page: save toggle on each card** | **▶ NEXT** |
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

## ── ACTIVE STEP: CE-5 — Result page: save toggle on each card ──

**Problem:** `result/[id]/page.tsx` — no save action on result cards. Users must navigate back to home to use Saved Games section.

**Files:** `app/result/[id]/page.tsx`, `app/result/[id]/page.module.css`, `app/result/[id]/SaveToggle.tsx` (new)

**Spec:**
- Create `SaveToggle` client component (`app/result/[id]/SaveToggle.tsx`):
  - Props: `appid: string`, `name: string`, `reason?: string`, `price_krw?: number | null`, `metacritic_score?: number | null`
  - On mount: `supabase.auth.getSession()` → if authed, fetch `/api/saved-games` (GET) → check if this appid is saved → set initial state
  - ★ (saved) / ☆ (not saved) toggle button, top-right of card, `position: absolute`
  - Click when not authed: `window.dispatchEvent(new CustomEvent('guildeline:open-login'))`
  - Click when authed: optimistic toggle + POST or DELETE `/api/saved-games`
  - Reuse `createBrowserClient` from `@supabase/ssr` (module scope, not inside component)
- In `result/[id]/page.tsx`: wrap card with `position: relative`, render `<SaveToggle>` inside each card
- Style: `font-size: 1.125rem`, accent color when saved, `--text-muted` when not saved, `padding: 0.375rem`, `border-radius: var(--radius)`, hover background `var(--bg-hover)`

**Out of scope:** Syncing save state with SavedGames home section in real-time.

**After completing:** clear lock → add Completed Step → set CE-6 as Active Step (copy spec from SPEC.md §CE-6)

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
| 2026-03-30 | fix(algo): tagProfile duplicate voteCount removed (√playtime only) + scoreCandidates candidate pool 80→300 | generate-recommendation/route.ts |
| 2026-03-30 | ux: price-unknown → Steam link; playtime placeholder "예: 50…"; home MC label unified | result/[id]/page.tsx, page.module.css, RecommendationForm.tsx, page.tsx |
| 2026-03-30 | ux: Metacritic label → "Metacritic Score XX" (unified across result, home, SavedGames) | result/[id]/page.tsx, page.tsx, SavedGames.tsx |
| 2026-03-30 | fix(a11y): priceUnknown — :focus-visible + prefers-reduced-motion missing, fixed | result/[id]/page.module.css |
| 2026-03-30 | ux: playtime placeholder "예: 50시간"; Metacritic responsive label (≤768px → MC XX) | RecommendationForm.tsx, result/[id]/page.tsx+css, page.tsx+css, SavedGames.tsx |
| 2026-03-31 | ux: result footer — row layout (feedback box left, scroll-to-top right), mobile stacks column | result/[id]/page.module.css |
| 2026-03-31 | ux: feedback buttons — confirmed state replaces both buttons with ✓ + "반영됐어요" (grey, fade-in) | result/[id]/FeedbackButtons.tsx, feedback.module.css |
| 2026-03-31 | CE-1: SavedGames touch tap-toggle panel; document click listener (scroll unblocked); savedCardKbdUnsave stopPropagation | SavedGames.tsx, page.module.css |
| 2026-03-31 | CE-2: canUsePicker — unlinked_auth + valid URL now allowed | RecommendationForm.tsx |
| 2026-03-31 | CE-3: LibraryPickerModal fetch — 10s timeout + AbortController + 다시 시도 버튼 | LibraryPickerModal.tsx, LibraryPickerModal.module.css |
| 2026-03-31 | ux: manual game dropdown keyboard navigation (ArrowUp/Down/Enter/Escape + scrollIntoView) | RecommendationForm.tsx, page.module.css |
| 2026-04-06 | fix(CE-4): feedback buttons — vote change enabled, active state, API failure rollback + error msg | result/[id]/FeedbackButtons.tsx, feedback.module.css |
| 2026-04-06 | ux(CE-4): success toast (1.5s auto-dismiss), error font 0.55→0.65rem, msgArea always-render (no layout jank) | result/[id]/FeedbackButtons.tsx, feedback.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1–B10, C1–C13, FT1–FT7, S1–S5 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
CE-series full spec → `SPEC.md §Phase CE`
AdSense activation → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec archive → `SPEC_archive.md`
