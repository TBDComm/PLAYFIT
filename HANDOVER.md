# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 141/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see rules/handover-rules.md §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

| Situation | Action |
|-----------|--------|
| Starting any work | Fill In-Progress Lock immediately |
| Completing a step | Clear lock → add Completed Step entry → update Active Step |
| Non-step change (bug, config, style) | Clear lock → add Minor Changes Log entry |
| Session interrupted | Leave lock filled — next session resumes from it |

Full writing rules and compression protocol → `rules/handover-rules.md`

---

## ── ⚠️ WORKSPACE CRASH PREVENTION ────────────────────────

**`npm run build` KILLS the Firebase Studio workspace (OOM). NEVER run it.**

| Instead of | Use |
|------------|-----|
| `npm run build` | `npx tsc --noEmit` (type-check only) |
| Build verification | `npm run dev` + browser test |
| Production build check | Only on Cloudflare Pages CI — never locally |

**VM spec:** 8GB RAM, no swap. `npm run build` needs ~1.5GB → instant OOM if available < 1GB.

---

## ── 🧹 MEMORY OPTIMIZATION ─────────────────────────────

Normal idle: ~3.4GB. If `free -m` shows available < 1GB, run:
```bash
pkill -f workerd; pkill -f firebase; pkill -f nixd
```
Recovers ~4GB+. Safe to kill: `workerd` (Cloudflare Edge emulator, auto-spawned, not needed for dev), `firebase-tools`/firebase MCP (project uses Supabase, not Firebase), `nixd` (Nix language server, not editing .nix files).

---

## ── 🔒 IN-PROGRESS LOCK ──────────────────────────────────

**Check this first. If filled, a previous session was interrupted — resume from here.**

```
STATUS: CLEAR
```

_When starting work, replace above with:_
```
STATUS: IN PROGRESS
Step: [N — name, or "non-step: description"]
Files touched: []
Stopped at: [update this as you go]
Next action: [exactly what to do next to resume]
```

---

## ── CURRENT STATUS ───────────────────────────────────────

| Step | Description | Status |
|------|-------------|--------|
| 1 | Next.js init + TypeScript + App Router + .env.local | ✅ 2026-03-11 |
| 2 | Steam URL parsing + SteamID resolution | ✅ 2026-03-13 |
| 3 | Owned games + play history extraction (top 15) | ✅ 2026-03-13 |
| 4 | Candidate games (featuredcategories → appdetails + filter) | ✅ 2026-03-13 |
| 5 | Claude API integration | ✅ 2026-03-13 |
| 6 | Main page UI | ✅ 2026-03-13 |
| 7 | Result page UI (5 cards) | ✅ 2026-03-13 |
| 8 | Supabase client + feedback route | ✅ 2026-03-13 |
| 9 | All error codes wired | ✅ 2026-03-13 |
| 10 | output: 'edge' + Cloudflare Pages build | ✅ 2026-03-13 |
| A1 | Supabase: games_cache + user_tag_weights + feedback.tag_snapshot | ✅ 2026-03-13 |
| A2 | DB build script (scripts/build-games-db.ts) | ✅ 2026-03-14 |
| A3 | Candidate selection: Supabase DB query (replace Steam real-time fetch) | ⬜ |
| A4 | Claude prompt → tag-based matching | ⬜ |
| A5 | Feedback → user_tag_weights weight update logic | ⬜ |
| A6 | Manual input mode UI (main page toggle + form) | ⬜ |
| A7 | /api/search autocomplete route | ⬜ |
| A8 | /api/recommend: handle both Steam + manual input modes | ⬜ |
| A9 | Test: Steam mode end-to-end | ⬜ |
| A10 | Test: Manual mode end-to-end | ⬜ |

**Key readiness:**
```
STEAM_API_KEY=                 ✅ set (.env.local + CF Pages)
ANTHROPIC_API_KEY=             ✅ set (.env.local + CF Pages)
NEXT_PUBLIC_SUPABASE_URL=      ✅ set (.env.local + CF Pages)
NEXT_PUBLIC_SUPABASE_ANON_KEY= ✅ set (.env.local + CF Pages)
```
Never mock or hardcode when a key is missing — stop and ask the user.

---

## ── ACTIVE STEP: 원본 MVP 검증 완료 → Addendum 대기 ────

**현재 상태:** 원본 Step 1–10 모두 구현 완료. API 키 세팅 후 end-to-end 검증 필요.

**Addendum 시작 조건:**
1. ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 모두 세팅
2. 원본 MVP 흐름 (Steam URL 입력 → 추천 5개 → 피드백) 정상 동작 확인
3. 그 다음 A1부터 순서대로 진행

**Addendum 새 에러코드 (A3+ 단계에서 추가):**
| Code | Trigger | Korean UI |
|------|---------|-----------|
| `DB_NOT_READY` | games_cache empty | DB가 아직 준비되지 않았어요 |
| `GAME_NOT_FOUND` | manual game not in DB | 게임을 찾을 수 없어요 |
| `TAG_EXTRACTION_FAILED` | no tags for played games | 플레이 기록에서 태그를 추출할 수 없어요 |

---

### ✅ A2 — 2026-03-14 — DB build script
- Files: `scripts/build-games-db.ts` (new)
- Run: `npx tsx --env-file=.env.local scripts/build-games-db.ts`
- Source: GetAppList/v2/ → genres + SteamSpy tags per app in parallel, 200ms delay; resumable (skips if updated within 30 days); first run takes several hours
- Upserts to `games_cache`: appid, name, genres TEXT[], tags JSONB {tag_name: vote_count}; logs every 100 games; on failure: log + skip
- Steps 1–10 + A1 archived → see `HANDOVER-archive.md`

## ── MINOR CHANGES LOG ────────────────────────────────────

| Date | Change | Files |
|------|--------|-------|
| 2026-03-13 | Fixed '--host' → '--hostname' for Next.js dev server in IDX preview | `.idx/dev.nix`, `GEMINI.md` |
| 2026-03-14 | Killed auto-spawned memory hogs (workerd 4GB, firebase MCP, nixd); documented in Crash Prevention + Memory Optimization sections | `HANDOVER.md` |

---

## ── PROJECT REFERENCE ────────────────────────────────────

Full spec → `SPEC.md` (read before implementing any step)
