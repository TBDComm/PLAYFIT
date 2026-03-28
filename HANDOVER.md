# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 100/200 lines — OK**
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
| 1–10, A1–A10 | MVP + Supabase + Claude tags (A7-1 removed: Steam API empty server-side) | ✅ 2026-03-13–16 |
| B1–B10 | Auth: Google OAuth, Steam OpenID, email+pw, link-steam migration, E2E tests | ✅ 2026-03-16 |
| C1–C13 | SEO, legal, GA4, architecture, game/genre/blog pages, AdSense, Schema, CWV | ✅ 2026-03-18–20 |
| FT1–FT7 | Preview strip, genre/blog UX, save system (saved_games table + API + UI) | ✅ 2026-03-21–23 |
| S1–S5 | Home polish, sample card, hero 2-col, section reorder, Steam persistence, /settings page | ✅ 2026-03-27–28 |
| S5-bugfix | Settings page load (server+wrapper+client split), feedback auth (Bearer), tag-weights merge, auth timing (onAuthStateChange) | ✅ 2026-03-28 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳ (pending AdSense approval)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅ · `saved_games` ✅

---

## ── ACTIVE STEP: none — ask user for next step ────

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-2026-03-28 entries → HANDOVER-archive.md §Minor Changes Log_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-28 | Remove all "AI" wording from meta/pages/blog | `layout.tsx`, `page.tsx`, `about`, `opengraph-image`, `terms`, `privacy`, 2 blog posts |
| 2026-03-28 | bug(feedback): anon key → service role for `user_tag_weights` upsert | `api/feedback/route.ts` |
| 2026-03-28 | bug(settings): server page + `SettingsWrapper`(dynamic ssr:false) + `SettingsClient`; `runtime=edge` ignored in `'use client'` files | `settings/` |
| 2026-03-28 | bug(feedback): add Authorization header; `getUserId()` bearer-first auth | `api/feedback/route.ts`, `result/page.tsx` |
| 2026-03-28 | bug(tag-weights GET): merge `user_id`+`steam_id` rows; fix empty state msg; parallelize profile+user_id queries | `api/tag-weights/route.ts`, `SettingsClient.tsx` |
| 2026-03-28 | bug(auth): `getSession`→`onAuthStateChange(INITIAL_SESSION)` in home+settings; double-call guard; `SettingsWrapper` loading skeleton | `page.tsx`, `SettingsClient.tsx`, `SettingsWrapper.tsx` |
| 2026-03-28 | bug(recommend): `getUserTagWeights` used anon key singleton → RLS blocked reads → weights always `{}` → fixed to `serviceSupabase` | `lib/supabase.ts` |
| 2026-03-28 | bug(feedback): feedback INSERT used anon key → RLS blocked → 500 returned early → weight upsert never ran → settings always empty → fixed to `serviceSupabase` | `app/api/feedback/route.ts` |
| 2026-03-28 | bug(auth): `TOKEN_REFRESHED` not handled in home+settings → expired token on first load stays 'anon' until manual refresh | `app/page.tsx`, `app/settings/SettingsClient.tsx` |
| 2026-03-28 | feat(ux): PageLoading on all pages while auth loading (home/result/settings) | `app/page.tsx`, `app/result/page.tsx`, `app/settings/SettingsClient.tsx` |
| 2026-03-28 | fix(home): early-return loading broke IntersectionObserver+count-up (refs null) → replaced with fixed overlay so DOM always mounts | `app/page.tsx`, `app/page.module.css` |
| 2026-03-28 | feat(home): library picker — Steam-linked users can pick up to 5 games from their library; modal with search + playtime display | `lib/steam.ts`, `app/api/steam/library/route.ts`, `app/components/LibraryPickerModal.tsx`, `app/components/LibraryPickerModal.module.css`, `app/page.tsx` |
| 2026-03-28 | fix(library-picker): loading message wrong (was "플레이 기록" for library picks); body scroll not locked; "0개" button text; max-5 count label | `app/page.tsx`, `app/components/LibraryPickerModal.tsx`, `app/components/LibraryPickerModal.module.css` |
| 2026-03-28 | feat(library-picker): add Steam capsule thumbnails to game rows; checkbox moved to right; selected row gets accent outline on thumb | `app/components/LibraryPickerModal.tsx`, `app/components/LibraryPickerModal.module.css` |
| 2026-03-28 | fix(library-picker): add loading="lazy" to thumbnails — prevents 2000+ simultaneous CDN requests on large libraries | `app/components/LibraryPickerModal.tsx` |
| 2026-03-28 | fix(library-picker): 7 guideline violations — img CLS, min-w-0 truncation, overscroll-behavior, focus-visible on all buttons, :focus→:focus-visible, touch-action, content-visibility | `app/components/LibraryPickerModal.tsx`, `app/components/LibraryPickerModal.module.css` |
| 2026-03-28 | fix(guidelines): Gemini code review — overlay/accent/error CSS variables, handleUnsave async-parallel, dropdown overscroll, aria-labels | `app/globals.css`, `app/page.module.css`, `app/components/SavedGames.tsx` |
| 2026-03-28 | refactor(supabase): migrate createBrowserClient from @supabase/auth-helpers-nextjs → @supabase/ssr (deprecated package) | `FeedbackButtons.tsx`, `RecommendationForm.tsx`, `Header.tsx`, `SavedGames.tsx`, `SettingsClient.tsx`, `reset-password/page.tsx` |
| 2026-03-28 | fix(styles): overscroll-behavior-x on savedStrip; #09090b→var(--bg) in LibraryPickerModal | `app/page.module.css`, `LibraryPickerModal.module.css` |
| 2026-03-28 | fix(styles): hardcoded #e8c31a→var(--metacritic), #09090b→var(--bg) in result page; add --metacritic to globals.css | `app/globals.css`, `app/result/[id]/page.module.css` |
| 2026-03-28 | fix(result): params→Promise<{id}>, cookies()+json() parallel, service-role for recommendation_sets INSERT | `app/result/[id]/page.tsx`, `app/api/generate-recommendation/route.ts` |
| 2026-03-28 | feat(result): Gemini refactor complete — sessionStorage→DB-persisted results, `/result/[id]` route, `recommendation_sets` table, library picker integration; fixed regex syntax, urlValid, react-icons, date-fns, edge runtime, server component handlers, RLS service role | `lib/steam.ts`, `app/components/RecommendationForm.tsx`, `app/page.module.css`, `app/result/[id]/` (new), `app/api/generate-recommendation/` (new), deleted: `app/api/recommend/`, `app/api/steam/`, `app/result/page.tsx`, `app/result/layout.tsx` |
| 2026-03-28 | refactor(code-quality): 5-fix guideline pass — globals.css variables (overlay/shadow/accent tints/error/success/white/brand colors), serviceSupabase centralized, @supabase/auth-helpers-nextjs removed, callApi helper extracted (dedup fetch logic), Array.isArray type guards on jsonb cards/tags | `app/globals.css`, `app/components/Header.module.css`, `app/reset-password/page.module.css`, `app/settings/page.module.css`, `app/games/[appid]/page.module.css`, `lib/supabase.ts`, `app/api/feedback/route.ts`, `package.json`, `app/components/RecommendationForm.tsx`, `app/result/[id]/page.tsx` |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
AdSense activation steps → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
