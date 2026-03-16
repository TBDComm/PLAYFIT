# PLAYFIT Handover

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
| A7-1 | Korean game name search (name_ko column + alias mapping) | ⬜ after A10 |
| A8 | /api/recommend: handle both Steam + manual input modes | ✅ 2026-03-15 |
| A9 | Test: Steam mode end-to-end | ✅ 2026-03-15 |
| A10 | Test: Manual mode end-to-end | ⬜ |
| B1–B10 | Authentication (email/Google/Steam login, user_profiles, session) | ⬜ pending A10 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ (all set in .env.local + CF Pages) — if missing, ask the user; never assume.

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows, 2026-03-15) · `user_tag_weights` ✅

---

## ── ACTIVE STEP: A10 — Test: Manual mode end-to-end ──────────────────────

**Prerequisites:** A6 ✅ · A7 ✅ · A8 ✅ — all deployed. Testing = browser on CF Pages.

**Test checklist (user runs in browser):**
1. Click manual mode toggle → verify 5-row input form appears
2. Type game name → verify dropdown appears after 300ms debounce
3. Blur input without dropdown selection → verify inline error "드롭다운에서 게임을 선택해주세요"
4. Enter 1+ valid games (name + appid via dropdown + playtime) → submit
5. Verify 5 recommendation cards appear (name, reason, price, store link)
6. Click feedback button → verify "피드백 감사해요" appears
7. Verify `feedback` table row inserted in Supabase (steam_id = null, tag_weights not updated)

**Files to fix if bugs found:** `app/page.tsx`, `app/api/recommend/route.ts`, `app/api/search/route.ts`

**Scope:** No new implementation — fix bugs only. No new features.

**After completing:** Mark A10 ✅ → read SPEC.md §B1, copy spec inline into Active Step → start B1.

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

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`