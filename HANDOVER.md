# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 144/200 lines — OK**
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

**Session start — run immediately (no exceptions):**
```bash
pkill -f workerd; pkill -f firebase; pkill -f nixd
```
Recovers ~4GB. Safe to kill: all three are unused in dev.

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
| A6 | Manual input mode UI (main page toggle + form) | ⬜ |
| A7 | /api/search autocomplete route | ⬜ |
| A8 | /api/recommend: handle both Steam + manual input modes | ⬜ |
| A9 | Test: Steam mode end-to-end | ⬜ |
| A10 | Test: Manual mode end-to-end | ⬜ |
| B1–B10 | Authentication (email/Google/Steam login, user_profiles, session) | ⬜ pending A10 |

**Key readiness:**
```
STEAM_API_KEY=                 ✅ set (.env.local + CF Pages)
ANTHROPIC_API_KEY=             ✅ set (.env.local + CF Pages)
NEXT_PUBLIC_SUPABASE_URL=      ✅ set (.env.local + CF Pages)
NEXT_PUBLIC_SUPABASE_ANON_KEY= ✅ set (.env.local + CF Pages)
```
Never mock or hardcode when a key is missing — stop and ask the user.

**Supabase tables:** `feedback` ✅ · `games_cache` ⏳ (build in progress, 66,000/86,543 rows as of 2026-03-15) · `user_tag_weights` ✅

---

## ── ACTIVE STEP: A9 → Steam mode end-to-end test ──────────

**Prerequisites before A9:**
- `games_cache` DB build must complete (currently 63,048/86,543 rows as of 2026-03-15, still running via GitHub Actions — safe to re-trigger when cut off by 6h limit)
- Fix `ownedAppIds` bug in `recommend/route.ts` + `steam/route.ts`:
  - **Bug:** `ownedAppIds` excludes only top 15 played games — user's other owned games can appear in recommendations
  - **Fix:** `getOwnedGames()` in `lib/steam.ts` returns full appid list separately; `/api/steam` adds `ownedAppIds: number[]` to response; `/api/recommend` uses that for exclusion instead of `playedAppIds`
- Run SQL in Supabase (score_candidates RPC + GIN index):
```sql
CREATE OR REPLACE FUNCTION score_candidates(
  p_tag_profile JSONB,
  p_user_tag_weights JSONB,
  p_owned_appids TEXT[],
  p_limit INT DEFAULT 50
)
RETURNS TABLE(appid TEXT, name TEXT, tags JSONB, score FLOAT8)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.appid,
    g.name,
    g.tags,
    (
      SELECT COALESCE(SUM(
        (t.value)::float8 * COALESCE((p_user_tag_weights->>t.key)::float8, 1.0)
      ), 0.0)
      FROM jsonb_each_text(g.tags) AS t(key, value)
      WHERE p_tag_profile ? t.key
    ) AS score
  FROM games_cache g
  WHERE NOT (g.appid = ANY(p_owned_appids))
    AND g.tags IS NOT NULL
    AND g.tags != '{}'::jsonb
  ORDER BY score DESC
  LIMIT p_limit;
$$;
CREATE INDEX IF NOT EXISTS games_cache_tags_gin ON games_cache USING GIN (tags);
```

**Why A9 before A6–A8:** A9 tests the already-implemented Steam pipeline (A1–A5) and has no dependency on A6–A8. A6–A8 add a new feature (manual input mode) and are done after A9 passes. SPEC.md §Manual Input Mode explicitly states "Add after Steam mode is fully tested (A9)."
**A9 scope:** Steam URL input → full pipeline → 5 recommendation cards → feedback → verify user_tag_weights updated in Supabase
**After A9 passes:** proceed to A6 (manual input UI) → A7 → A8 → A10

---

## ── MINOR CHANGES LOG ────────────────────────────────────

| Date | Change | Files |
|------|--------|-------|
| 2026-03-14 | Anthropic SDK → fetch: fixed Edge runtime incompatibility | `lib/claude.ts` |
| 2026-03-14 | Added Korean-only / free-only filter toggles | `app/page.tsx`, `app/page.module.css` |
| 2026-03-14 | Contextual NO_GAMES_IN_BUDGET error messages | `app/page.tsx`, `app/api/steam/route.ts` |
| 2026-03-14 | A5 fix: feedback insert error check; h1 hierarchy on result page; placeholder `…` | multiple |
| 2026-03-15 | ownedAppIds bug fix: getOwnedGames() returns full appid list; /api/steam passes ownedAppIds; /api/recommend uses all owned games for exclusion | `lib/steam.ts`, `app/api/steam/route.ts`, `app/api/recommend/route.ts`, `app/page.tsx` |

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`