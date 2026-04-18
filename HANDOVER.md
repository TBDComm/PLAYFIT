# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 93/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see `rules/handover-rules.md` §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

Start work → fill In-Progress Lock. Finish step → clear lock + update Active Step. Writing style + compression rules → `rules/handover-rules.md`.

---

## ── WORKSPACE CRASH PREVENTION ────────────────────────────

**NEVER `npm run build` or `npm run dev` — instant OOM crash / banned.** Use `npx tsc --noEmit` for type-check only. Testing = `git push` → Cloudflare Pages deploy → user tests in browser.

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
| 1–10, A1–A10 | MVP + Supabase + Claude tags | ✅ 2026-03-13–16 |
| B1–B10 | Auth: Google OAuth, Steam OpenID, email+pw | ✅ 2026-03-16 |
| C1–C13 | SEO, legal, GA4, architecture, AdSense | ✅ 2026-03-18–20 |
| FT1–FT7 | Preview strip, genre/blog UX, save system | ✅ 2026-03-21–23 |
| S1–S5 + bugfixes | Home polish, settings, auth bugs, library picker | ✅ 2026-03-27–28 |
| CE-1–CE-31 | Completeness & Experience: UX, a11y, forms | ✅ 2026-03-31–04-11 |
| PRE-SQ: AdSense Articles | Blog/articles section — AdSense approval prerequisite | ✅ 2026-04-12 |
| **SQ-1~SQ-6** | **Phase SQ P1 — Squad MVP (taste-based LFG)** | ✅ 2026-04-12 |
| SQ-7~SQ-8 | Phase SQ P2 — Game Boards: DB migration + comments API | ✅ 2026-04-13 |
| SQ-9~SQ-10 | Phase SQ P2 — Game Boards: UI | ✅ 2026-04-15 |
| SQ-11 | Phase SQ P3 — user_profiles extension + settings edit UI | ✅ 2026-04-15 |
| SQ-12 + SQ-14 | Phase SQ P3 — `/users/[userId]` public profile + squad history inline + settings share link | ✅ 2026-04-15 |
| SQ-13 | Phase SQ P3 — `@vercel/og` OG cards (CF Pages compat verified first) | ✅ 2026-04-16 |
| SQ-15 | Phase SQ P3 — IGDB re-evaluation (AdSense approval gate) | 🕑 blocked |
| **SQ-ENH-1~4** | **Squad 분석 개선 (설계 완료, 미구현)** | 📋 planned |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: SQ-15 ──

SQ-13 complete (2026-04-16). All Phase SQ P1–P3 steps done except SQ-15 (blocked on AdSense approval).

**SQ-15**: IGDB integration re-evaluation — gated on AdSense approval. Read `SPEC.md §SQ-15` (line 186) when unblocked.

---

## ── PLANNED: Squad Enhancement (SQ-ENH-1~4) ──────────────

설계 확정, 미구현. 착수 시 순서대로 진행.

**SQ-ENH-1 — Pairwise 일치율 스코어링** (`lib/squad.ts`)
- 현재: 개인 ↔ 필터된 그룹 프로필 코사인 유사도 → 항상 80%+ 편향
- 변경: 각 멤버 일치율 = 나머지 멤버들과의 코사인 유사도 평균
- `mergeTagProfiles` / 추천 스코어링 로직은 그대로 유지
- 영향 파일: `lib/squad.ts` (calcMatchScore → calcPairwiseMatchScore)

**SQ-ENH-2 — 멤버별 취향픽** (`app/api/squad/route.ts`, `lib/claude.ts`, `types/`)
- 각 멤버의 개인 tagProfile로 후보 재스코어링 (병합 프로필 아님)
- 그룹 추천 5개와 겹치지 않는 상위 1~2개 선정
- Claude에게 멤버별 픽 카드 생성 요청 (reason 포함)
- 결과 타입에 `memberPicks: Record<steamId, SquadRecommendationCard[]>` 추가

**SQ-ENH-3 — 분석 설명** (`lib/claude.ts`)
- Claude가 공통 태그·갈림 태그 기반으로 1~2문장 자연어 설명 생성
- 기존 추천 API 호출에 `analysisReason: string` 필드 추가 (별도 API 호출 없음)

**SQ-ENH-4 — 인기 멀티 게임 섹션** (`app/api/squad/route.ts`, result page)
- Steam 스토어 검색 API 사용 (API 키 불필요):
  `store.steampowered.com/search/results/?tags=1191&sort_by=Reviews_DESC&json=1`
  (tag 1191 = Multiplayer)
- 그룹 추천·멤버픽과 겹치지 않는 인기 멀티 게임 3~5개
- 가격은 기존 `getGameDetails` / price cache 재활용
- 결과 타입에 `popularMultiplayer: SquadRecommendationCard[]` 추가

**결과 페이지 신규 섹션 순서** (SQ-ENH-1~4 완료 후):
1. 취향 일치율 히어로 + 멤버 pill (기존 — 스코어만 수정됨)
2. **분석 설명** (ENH-3) — 태그 기반 한두 문장
3. 그룹 추천 카드 5개 (기존 유지)
4. **멤버별 취향픽** (ENH-2) — 멤버명 + 게임 1~2개씩
5. **같이 하면 재밌는 멀티 게임** (ENH-4) — 인기 멀티 3~5개

---

## ── COMPLETED STEPS ──────────────────────────────────────

- A, B, C, FT, S, CE series archived → `HANDOVER-archive.md` + `SPEC_archive.md` (both have section indexes at top)

---

## ── PROJECT REFERENCE ────────────────────────────────────

| Need | File |
|------|------|
| Active phase spec | `SPEC.md §Phase SQ` |
| Squad MVP implementation plan | `/home/user/.claude/plans/purrfect-mapping-pelican.md` |
| Completed phase specs (CE, S, FT, C, B, A) | `SPEC_archive.md` |
| Completed session logs + minor changes | `HANDOVER-archive.md` |
| Env vars + Supabase tables | `memory/project_stack.md` |
| AdSense activation checklist | `HANDOVER-archive.md §AdSense Activation Checklist` |
| Ultimate vision context | `memory/project_ultimate_vision.md` |
