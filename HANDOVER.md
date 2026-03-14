# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 155/200 lines — OK**
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
| 1–10 | 원본 MVP | ✅ |
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

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (empty — build script not yet run) · `user_tag_weights` ✅

---

## ── ACTIVE STEP: A3 준비 완료 → DB 빌드 후 시작 ────────

**현재 상태:** MVP end-to-end 검증 완료 (추천 5개 + 피드백). Addendum 시작 조건 모두 충족.

**A3 시작 전 필수:**
- `games_cache` 테이블에 데이터가 있어야 함 (현재 empty)
- 빌드 스크립트 실행: `npx tsx --env-file=.env.local scripts/build-games-db.ts`
- 스크립트 첫 실행 수 시간 소요 → 완료 후 A3 구현

**A3 구현 범위 (SPEC.md Candidate Selection Logic):**
1. 플레이한 게임들의 tags를 `games_cache`에서 조회
2. playtime 가중 태그 프로필 빌드
3. `user_tag_weights` 조회 (없으면 기본값 1.0)
4. `games_cache` 쿼리: 보유 게임 제외 + tag overlap 점수 → top 50
5. top 50만 appdetails 실시간 조회 (200ms delay) → 예산 필터
6. 최종 후보 Claude에게 전달
- `DB_NOT_READY` 에러 추가 필요 (games_cache empty 시)
- `TAG_EXTRACTION_FAILED` 에러 추가 필요

**Addendum 새 에러코드:**
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
| 2026-03-14 | Memory optimization: killed workerd/firebase/nixd; documented | `HANDOVER.md` |
| 2026-03-14 | Anthropic SDK → fetch: Edge runtime 호환성 수정 | `lib/claude.ts` |
| 2026-03-14 | MVP 검증 중 발견: Claude 응답 markdown 코드블록 wrapping → JSON.parse 실패 → 코드블록 제거 로직 추가 | `lib/claude.ts` |
| 2026-03-14 | 한국어 지원 게임만 / 무료 게임만 필터 토글 추가 | `app/page.tsx`, `app/page.module.css`, `lib/steam.ts`, `app/api/steam/route.ts` |
| 2026-03-14 | NO_GAMES_IN_BUDGET 에러 메시지를 활성 필터 상태에 따라 다르게 표시 | `app/page.tsx`, `app/api/steam/route.ts` |
| 2026-03-14 | 가이드라인 점검: checkbox name 속성 추가, label disabled cursor 수정 | `app/page.tsx`, `app/page.module.css` |

---

## ── PROJECT REFERENCE ────────────────────────────────────

Full spec → `SPEC.md` (read before implementing any step)
