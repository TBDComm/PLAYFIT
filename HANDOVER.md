# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 120/200 lines — OK**
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
| A6 | Manual input mode UI (main page toggle + form) | ✅ 2026-03-15 |
| A7 | /api/search autocomplete route | ✅ 2026-03-15 |
| A8 | /api/recommend: handle both Steam + manual input modes | ✅ 2026-03-15 |
| A9 | Test: Steam mode end-to-end | ✅ 2026-03-15 |
| A10 | Test: Manual mode end-to-end | ⬜ |
| B1–B10 | Authentication (email/Google/Steam login, user_profiles, session) | ⬜ pending A10 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ (모두 .env.local + CF Pages 설정 완료) — 없으면 추정 말고 유저에게 물어볼 것.

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows, 2026-03-15) · `user_tag_weights` ✅

---

## ── ACTIVE STEP: A10 — Test: Manual mode end-to-end ──────────────────────

A8 ✅ complete (2026-03-15). A7+A8 구현 완료, 수동 모드 E2E 테스트 진행 중.

**A7 implementation summary:**
- `app/api/search/route.ts` — GET /api/search?q={query}, ILIKE search on games_cache, limit 10
- `app/page.tsx` — debounced autocomplete (300ms), dropdown select, blur/submit validation, rowErrors
- `app/page.module.css` — dropdown, dropdownItem, rowError styles
- **Bug fixed:** `req.nextUrl.searchParams` → `new URL(req.url).searchParams` (CF edge compat)

**A7-1 — 한국어 게임 이름 검색 (pending):**
- 현재 ILIKE는 영문 이름만 검색 가능
- 목표: "카스", "카운터 스트라이크" 같은 한국어 입력으로도 매칭
- 구현 방향: `games_cache`에 `name_ko TEXT` 컬럼 추가 → 인기 게임 한국어 별칭 등록 → `name ILIKE OR name_ko ILIKE`
- 우선순위: A8, A10 이후 구현

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

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`