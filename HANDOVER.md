# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 142/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see rules/handover-rules.md §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

| Situation | Action |
|-----------|--------|
| Starting any work | Fill In-Progress Lock immediately |
| Completing a step | Clear lock → add Completed Step entry → update Active Step |
| Non-step change (bug, config, style) | Clear lock → add Minor Changes Log entry |
| Session interrupted | Leave lock filled — next session resumes from it |

Full writing rules → `rules/handover-rules.md`

---

## ── WORKSPACE CRASH PREVENTION ────────────────────────────

**NEVER `npm run build` or `npm run dev` — instant OOM crash / banned.** Use `npx tsc --noEmit` for type-check only. Testing = `git push` → Cloudflare Pages deploy → user tests in browser.

**Session start — if firebase/nixd still running, kill manually:**
```bash
kill $(pgrep -f firebase) $(pgrep -f nixd) 2>/dev/null; echo done
```
`next dev` auto-start disabled via `.idx/dev.nix` (previews.enable = false). If VM still crashes → RESTART workspace.

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
| A1 | Supabase: games_cache + user_tag_weights + feedback.tag_snapshot | ✅ 2026-03-13 |
| A2 | DB build script (scripts/build-games-db.ts) | ✅ 2026-03-14 |
| A3 | Candidate selection: Supabase DB query (replace Steam real-time fetch) | ✅ 2026-03-14 |
| A4 | Claude prompt → tag-based matching | ✅ 2026-03-14 |
| A5 | Feedback → user_tag_weights weight update logic | ✅ 2026-03-14 |
| A6 | Manual input mode UI (main page toggle + form) | ✅ 2026-03-15 |
| A7 | /api/search autocomplete route | ✅ 2026-03-15 |
| A7-1 | Korean game name search — removed (Steam API doesn't support Korean server-side) | ❌ 2026-03-16 |
| A8 | /api/recommend: handle both Steam + manual input modes | ✅ 2026-03-15 |
| A9 | Test: Steam mode end-to-end | ✅ 2026-03-15 |
| A10 | Test: Manual mode end-to-end | ✅ 2026-03-16 |
| B1 | Create `user_profiles` table | ✅ 2026-03-16 |
| B2 | Alter `user_tag_weights` + `feedback` (add user_id, keep steam_id) | ⬜ |
| B3 | Email + Google auth — login modal, Supabase session, logout | ⬜ |
| B4 | Steam OpenID — `/api/auth/steam` + callback | ⬜ |
| B4-link | `/api/auth/link-steam` — Steam URL → migrate weights to user_id | ⬜ |
| B5 | Update `/api/recommend` — all four auth cases | ⬜ |
| B6 | Update `/api/feedback` — user_id if session, steam_id if not | ⬜ |
| B7 | Header + login modal + Steam link popup + main page per auth state | ⬜ |
| B8–B10 | E2E tests (email, Steam, non-auth) | ⬜ |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ (all set in .env.local + CF Pages) — if missing, ask the user; never assume.

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows, 2026-03-15) · `user_tag_weights` ✅

---

## ── ACTIVE STEP: B2 — Alter `user_tag_weights` + `feedback` ─────────────

**Scope:** Supabase SQL editor only — no code changes.

**SQL to run:**
```sql
ALTER TABLE user_tag_weights
  ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
ALTER TABLE user_tag_weights
  ADD CONSTRAINT user_tag_weights_user_tag_unique UNIQUE(user_id, tag);

ALTER TABLE feedback ADD COLUMN user_id UUID REFERENCES auth.users;
```

**Why steam_id is NOT dropped:** Non-authenticated users accumulate weights by steam_id across visits. On login + Steam URL link (B4-link), those rows are migrated:
`UPDATE user_tag_weights SET user_id = ? WHERE steam_id = ? AND user_id IS NULL`

**Verify:** `user_tag_weights` has columns: `steam_id`, `tag`, `weight`, `updated_at`, `user_id`. `feedback` has `user_id` column.

**After completing:** Mark B2 ✅ → start B3 (read SPEC.md §Authentication [Addendum B] first).

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-14 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-15 | ownedAppIds bug fix: full owned game list for exclusion | `lib/steam.ts`, `app/api/steam/route.ts`, `app/api/recommend/route.ts`, `app/page.tsx` |
| 2026-03-15 | npm run dev banned; testing = git push → CF Pages deploy | `HANDOVER.md` |
| 2026-03-15 | Fix CF Workers subrequest limit: scored pool 50→40, candidates cap 30→20 | `app/api/recommend/route.ts` |
| 2026-03-15 | Debug logging added to catch blocks + supabase error fields | `app/api/recommend/route.ts`, `app/api/steam/route.ts`, `lib/supabase.ts` |
| 2026-03-15 | Remove koreanOnly filter entirely — global targeting, language-agnostic | `app/page.tsx`, `app/api/recommend/route.ts`, `app/result/page.tsx`, `types/index.ts`, `lib/steam.ts` |
| 2026-03-15 | Fix AI_PARSE_FAILURE: robust JSON extraction ({} match), reason 1 sentence | `lib/claude.ts` |
| 2026-03-15 | Pre-A6: 2-button feedback (remove neutral), playtime sqrt+normalize scoring | `types/index.ts`, `app/result/page.tsx`, `app/api/feedback/route.ts`, `app/api/recommend/route.ts`, Supabase score_candidates RPC |
| 2026-03-15 | A6: manual mode toggle + 5-row form + manual mode disclaimer notice | `app/page.tsx`, `app/page.module.css` |
| 2026-03-15 | Fix 3 guideline violations: label→span, flex min-width, prefers-reduced-motion | `app/page.tsx`, `app/page.module.css` |
| 2026-03-15 | A7: /api/search route + autocomplete UI + blur/submit validation | `app/api/search/route.ts`, `app/page.tsx`, `app/page.module.css` |
| 2026-03-15 | Fix: req.nextUrl → new URL(req.url) for CF edge runtime compat | `app/api/search/route.ts` |
| 2026-03-15 | A8: /api/recommend handles manualGames body shape (manual mode) | `app/api/recommend/route.ts` |
| 2026-03-15 | Fix 4 guideline violations: themeColor, alert/aria-live, focus-first-error, dead CSS | `app/layout.tsx`, `app/page.tsx`, `app/result/page.module.css` |
| 2026-03-16 | Search debounce 300ms → 0ms + add missing debounceRefs declaration (lost in crash) | `app/page.tsx` |
| 2026-03-16 | A7-1: Korean search via Steam Suggest API → appid → games_cache English name lookup | `app/api/search/route.ts`, `app/page.tsx` |
| 2026-03-16 | Fix: add .dropdownItem to prefers-reduced-motion block (transition: none) | `app/page.module.css` |
| 2026-03-16 | Remove A7-1 Korean search (Steam API returns empty server-side); add exact English name notice to manual mode | `app/api/search/route.ts`, `app/page.tsx` |
| 2026-03-16 | Dead code cleanup: remove unused types (ClaudeRecommendationResponse, FeedbackPayload), unexport internal interfaces, remove @anthropic-ai/sdk from package.json (unused, direct fetch used) | `types/index.ts`, `lib/claude.ts`, `lib/steam.ts`, `package.json`, `package-lock.json` |
| 2026-03-16 | Revised B-series spec: steam_id NOT dropped (pre-login data), new B4-link step, Steam link popup UX, four auth cases for B5/B6 | `SPEC.md`, `HANDOVER.md` |

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`