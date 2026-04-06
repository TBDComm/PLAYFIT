# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 126/200 lines — OK**
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
| **CE-6** | **Steam link popup: remove auto-trigger + add benefit copy** | **▶ NEXT** |
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

## ── ACTIVE STEP: CE-6 — Steam link popup: remove auto-trigger, add benefit copy ──

**Problem:** `Header.tsx:118-119` — Steam link popup fires immediately after Google login before user sees home page. No explanation of benefits anywhere near the button.

**Files:** `app/components/Header.tsx`, `app/components/Header.module.css`

**Spec:**
- Remove the auto-popup on login: delete/comment out the `if (!steamLinked) setShowLinkPopup(true)` call (or equivalent) that fires in the `SIGNED_IN` handler
- In the header dropdown, above the "Steam 연동하기" button: add `<p>` with copy: `"연동하면 플레이 기록 자동 분석 + 라이브러리 직접 선택"`
- Style for new copy: `font-size: 0.75rem`, `color: var(--text-muted)`, `margin-bottom: 0.375rem`
- The "Steam 연동하기" button and its modal remain fully functional — only the auto-trigger is removed

**Out of scope:** Changing the link modal or settings page.

**After completing:** clear lock → add Completed Step → set CE-8 as Active Step (copy spec from SPEC.md §CE-8)

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 entries → HANDOVER-archive.md §Minor Changes Log 2026-03-28_
_2026-03-29 entries (early) → HANDOVER-archive.md §Minor Changes Log 2026-03-29_
_2026-03-29 (late) – 2026-03-31 entries → HANDOVER-archive.md §Minor Changes Log 2026-03-29 (late) to 2026-03-31_

| Date | Change | Files |
|------|--------|-------|
| 2026-04-06 | fix(CE-4): feedback buttons — vote change enabled, active state, API failure rollback + error msg | result/[id]/FeedbackButtons.tsx, feedback.module.css |
| 2026-04-06 | ux(CE-4): success toast (1.5s auto-dismiss), error font 0.55→0.65rem, msgArea always-render (no layout jank) | result/[id]/FeedbackButtons.tsx, feedback.module.css |
| 2026-04-06 | feat(CE-5): SaveToggle ★/☆ on result cards; server-side saved_games pre-fetch (rec + saved parallel); optimistic toggle + rollback | result/[id]/SaveToggle.tsx (new), page.tsx, page.module.css |
| 2026-04-06 | fix(CE-5 UX): SaveToggle — pendingRef double-click guard, error msg 2s display, touch target 44px | result/[id]/SaveToggle.tsx, page.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1–B10, C1–C13, FT1–FT7, S1–S5 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
CE-series full spec → `SPEC.md §Phase CE`
AdSense activation → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec archive → `SPEC_archive.md`
