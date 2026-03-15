# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 117/200 lines — OK**
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
| A9 | Test: Steam mode end-to-end | ✅ 2026-03-15 |
| A10 | Test: Manual mode end-to-end | ⬜ |
| B1–B10 | Authentication (email/Google/Steam login, user_profiles, session) | ⬜ pending A10 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ (모두 .env.local + CF Pages 설정 완료) — 없으면 추정 말고 유저에게 물어볼 것.

**Supabase tables:** `feedback` ✅ · `games_cache` ⏳ (build in progress, 66,000/86,543 rows as of 2026-03-15) · `user_tag_weights` ✅

**Pending after games_cache build completes:** korean_review_count 빌드 (deferred, koreanOnly 필터 제거됐으나 보류 중) — 상세 플랜 → `/home/user/.claude/plans/memoized-swimming-gem.md`

---

## ── ACTIVE STEP: Pre-A6 scoring fixes ──────────────────────

A9 ✅ 완료. 테스트 중 발견한 2가지 스코어링 문제 수정 후 A6 진행.
**전체 스펙 → `SPEC.md §Pre-A6`**

**Fix 1: 2-button feedback**
- neutral 버튼 제거. 모든 피드백이 user_tag_weights에 반영.
- Files: `types/index.ts`, `app/result/page.tsx`, `app/api/feedback/route.ts`

**Fix 2: Playtime-proportional scoring**
- 플레이타임 비례 스코어링 (sqrt 감쇠 + 정규화)
- 순서: Supabase SQL 먼저 → 코드 → git push
- Files: `app/api/recommend/route.ts` + Supabase score_candidates RPC

**After both fixes:** A6 (manual input UI) → A7 → A8 → A10

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

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`