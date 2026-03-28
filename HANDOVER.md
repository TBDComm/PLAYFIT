# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 166/200 lines — OK**
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
| 1–10, A1–A10 | MVP + Supabase + Claude tags (A7-1 removed: Steam API empty server-side) | ✅ 2026-03-13–16 |
| B1–B10 | Auth: Google OAuth, Steam OpenID, email+pw, link-steam migration, E2E tests | ✅ 2026-03-16 |
| C1–C13 | SEO, legal, GA4, architecture, game/genre/blog pages, AdSense, Schema, CWV | ✅ 2026-03-18–20 |
| FT1–FT7 | Preview strip, genre/blog UX, save system (saved_games table + API + UI) | ✅ 2026-03-21–23 |
| S1 | Home page polish: remove howSection, hero animation, stat counter, scroll reveals, tile stagger, label accent, URL validation, button pulse, TagScatter opacity | ✅ 2026-03-27 |
| S1-fix | tileFadeUp both→backwards (rotation bug), urlValid→derived, statCount→useRef | ✅ 2026-03-27 |
| S2 | Sample result card (Hades, between form+preview), heroCta ↓ bounce, previewTitle copy fix | ✅ 2026-03-27 |
| S3 | Hero 2-col layout (1100px heroInner): sample card moves into hero right column. Desktop: side-by-side. Mobile: stacked below CTA. Standalone sampleSection removed. | ✅ 2026-03-28 |
| S3-fix | Logo overflow in heroGrid + mobile regression: override scoped to `@media (min-width: 769px)` — 2-column range only; mobile restores full `clamp(3rem,10vw,5rem)` | ✅ 2026-03-28 |
| S4 | Move sampleSection below formSection: Hero → Form → Sample → Preview | ✅ 2026-03-28 |
| S5 | Fix Steam link persistence bug (update→upsert); /settings page (Steam re-link + tag weight bar graph editor); Header "내 설정" link | ✅ 2026-03-28 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳ (pending AdSense approval — add to CF Pages when Publisher ID received)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅ · `saved_games` ✅

---

## ── ACTIVE STEP: none — ask user for next step ────

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-21 to 2026-03-27 entries → HANDOVER-archive.md §Minor Changes Log_

- 2026-03-28 Remove all "AI" wording: layout meta, page.tsx heroStat/previewLabel, about, opengraph-image, terms, privacy, 2 blog posts
- 2026-03-28 sampleCard: moved to sampleSection (below hero, above form); layout matches result page card (row, 30% thumb, no badge); mobile ≤480px column
- 2026-03-28 sampleSection moved below formSection: order is now Hero → Form → Sample → Preview
- 2026-03-28 link-steam: update→upsert (email/Google users had no user_profiles row → silent save failure)
- 2026-03-28 settings: guideline audit fixes — label/aria-live/aria-label/focus-visible/beforeunload/double-commit guard
- 2026-03-28 settings: UX audit fixes — linkForm hidden during loading, weightsReady skeleton, save/reload error feedback
- 2026-03-28 /settings page: Steam re-link + tag weight bar graph editor (GET/PUT /api/tag-weights)
- 2026-03-28 Header: added "내 설정" link → /settings; removed "Steam 연동됨" text (status visible in settings)

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
AdSense activation steps (post FT-series) → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
