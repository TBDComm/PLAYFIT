# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 95/200 lines — OK**
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

| Date | Change | Files |
|------|--------|-------|
| 2026-03-28 | Add home loading screen + progress bar gauge to PageLoading | app/loading.tsx, PageLoading.tsx, PageLoading.module.css |
| 2026-03-28 | Result page: horizontal compact card list + color-coded Metacritic + tag line nowrap | result/[id]/page.tsx, page.module.css |
| 2026-03-28 | PageLoading: remove radar sweep, parallelogram HUD gauge (stall 85%) | PageLoading.tsx, PageLoading.module.css |
| 2026-03-28 | LoadingOverlay: remove radar sweep, parallelogram terminal bars, fix overlay-backdrop variable | LoadingOverlay.tsx, LoadingOverlay.module.css |
| 2026-03-28 | Loading gauge UX: state-driven macro bar in LoadingOverlay, termBar forwards, PageLoading 1.5s | LoadingOverlay.tsx/css, PageLoading.module.css |
| 2026-03-28 | PageLoading: fake progress → indeterminate phosphor scan (infinite, no false progress) | PageLoading.module.css |
| 2026-03-29 | LoadingOverlay: radar SVG → logo outline glow via rotating drop-shadow offset | LoadingOverlay.tsx, LoadingOverlay.module.css |
| 2026-03-29 | Result page: restore pre-Gemini layout (grid, full-width image + overlay); feedback buttons → text labels | result/[id]/page.tsx, page.module.css, FeedbackButtons.tsx |
| 2026-03-29 | fix: NO_GAMES_IN_BUDGET false positive — candidate pool 40→80 parallel (no latency increase) | generate-recommendation/route.ts |
| 2026-03-29 | fix: Steam URL persistence — AuthContext (SIGNED_IN handling, single DB query, shared state) | app/context/AuthContext.tsx, layout.tsx, Header.tsx, RecommendationForm.tsx |
| 2026-03-29 | remove dead code: showLinkBtn unused variable in Header | Header.tsx |
| 2026-03-29 | fix: getGameDetails throws on Steam rate-limit — add res.ok guard | lib/steam.ts |
| 2026-03-29 | fix: add candidates.length===0 guard + diagnostic logs + Supabase error → JSON | generate-recommendation/route.ts |
| 2026-03-29 | restore: result page horizontal compact layout (ed94977) — 477f2f2 restore went too far back to grid | result/[id]/page.tsx, page.module.css |
| 2026-03-29 | result page: thumbnail fixed width (220px) + natural aspect ratio (no crop); remove "왜 나한테 맞냐면" label | result/[id]/page.tsx, page.module.css |
| 2026-03-29 | result page: card hover → accent border + lime glow; heroSubtitle tags nowrap confirmed | result/[id]/page.module.css |
| 2026-03-29 | result page: thumbnail fill+stretch restored (240px wide), fills card height on left | result/[id]/page.tsx, page.module.css |
| 2026-03-29 | result page: card layout more spacious (padding/spacing up), feedback buttons bottom-right | result/[id]/page.module.css |
| 2026-03-29 | result page: thumbnail width/height explicit (no fill), align-self:stretch + aspect-ratio:460/215 → auto-width, no crop | result/[id]/page.tsx, page.module.css |
| 2026-03-29 | fix: add res.ok guards to getOwnedGames, getAllLibraryGames, resolveVanityUrl | lib/steam.ts |
| 2026-03-29 | fix: price caching in games_cache — DB-first lookup, Steam only for cache misses | lib/supabase.ts, generate-recommendation/route.ts |
| 2026-03-29 | fix: cap Steam fetches at 15 — CF Workers free plan 50 subrequest/invocation limit | generate-recommendation/route.ts |
| 2026-03-29 | ux: result card body padding/spacing increase — cardBody 1.5rem 2rem, internal margins up | result/[id]/page.module.css |
| 2026-03-29 | ux: storeLink → accent button style; heroSubtitle nowrap removed → text-wrap:pretty | result/[id]/page.module.css |
| 2026-03-29 | ux: portrait thumbnail (library_600x900) + header.jpg fallback; thumbnailWrap aspect-ratio 2/3 | result/[id]/ThumbnailImage.tsx, page.tsx, page.module.css |
| 2026-03-29 | ux: feedback buttons → right-side column, +/- square buttons, hint label vertical text | result/[id]/FeedbackButtons.tsx, feedback.module.css, page.tsx, page.module.css |
| 2026-03-29 | fix: feedback.module.css prefers-reduced-motion + hint font 0.6→0.65rem | result/[id]/feedback.module.css |
| 2026-03-29 | ux: feedback buttons fill column (flex:1, width:80px), hint label removed | result/[id]/FeedbackButtons.tsx, feedback.module.css |
| 2026-03-29 | ux: feedback notice above results + footer feedback box with accent border | result/[id]/page.tsx, page.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1–B10, C1–C13, FT1–FT7, S1–S5 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
CE-series full spec → `SPEC.md §Phase CE`
AdSense activation → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec archive → `SPEC_archive.md`
