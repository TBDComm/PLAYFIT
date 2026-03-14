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

Full writing rules and compression protocol → `rules/handover-rules.md`

---

## ── ⚠️ WORKSPACE CRASH PREVENTION ────────────────────────

**`npm run build` KILLS the Firebase Studio workspace (OOM). NEVER run it.**

| Instead of | Use |
|------------|-----|
| `npm run build` | `npx tsc --noEmit` (type-check only) |
| Build verification | `npm run dev` + browser test |
| Production build check | Only on Cloudflare Pages CI — never locally |

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
| 9 | All error codes wired | ✅ 2026-03-13 (verified — no gaps found) |
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
STEAM_API_KEY=           ✅ set
ANTHROPIC_API_KEY=       ← needed for Step 5
NEXT_PUBLIC_SUPABASE_URL=      ← needed for Step 8
NEXT_PUBLIC_SUPABASE_ANON_KEY= ← needed for Step 8
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
- Source: GetAppList/v2/ → full Steam app list (~100k apps)
- Per app: Steam genres + SteamSpy tags fetched in parallel, 200ms delay
- Skips entries updated within 30 days → resumable (safe to interrupt and re-run)
- Logs every 100 games; on failure: log + skip, never crash
- Upserts to games_cache: appid, name, genres TEXT[], tags JSONB {tag_name: vote_count}
- First run takes several hours

## ── MINOR CHANGES LOG ────────────────────────────────────

| Date | Change | Files |
|------|--------|-------|
| 2026-03-13 | Fixed incorrect '--host' flag to '--hostname' for Next.js dev server in IDX preview | `.idx/dev.nix`, `GEMINI.md` |
| — | No minor changes yet | — |

---

## ── COMPLETED STEPS ──────────────────────────────────────

### ✅ Step 10 — 2026-03-13 — Cloudflare Pages 배포 설정 (순서 앞당김)
- Files: `package.json`, `next.config.js`, `app/api/steam/route.ts`, `wrangler.toml`
- Installed: `@cloudflare/next-on-pages`, `wrangler`
- Added `export const runtime = 'edge'` to `/api/steam` (이후 스텝의 모든 API route에도 추가 필요)
- `pages:build` script: `npx @cloudflare/next-on-pages` → `.vercel/output/static`
- CF Pages 설정: Build command `npm run pages:build`, Output `.vercel/output/static`, Compatibility flag `nodejs_compat`
- Build: Edge Function Routes: `/api/steam` ✅

### ✅ Step 8 — 2026-03-13 — Supabase client + feedback route
- Files: `lib/supabase.ts` (new), `app/api/feedback/route.ts` (new)
- createClient with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
- POST /api/feedback → insert into feedback table → 200 or 500
- All fields validated before insert; runtime = 'edge'
- Build: /api/feedback ƒ (Dynamic) ✅

### ✅ Step 7 — 2026-03-13 — Result page UI (5 cards)
- Files: `app/result/page.tsx` (new), `app/result/page.module.css` (new)
- sessionStorage → RecommendationCard[], missing/invalid → router.replace('/')
- Cards: name, reason (label + text), meta row (price/score/korean), store link, feedback buttons
- Price: Intl.NumberFormat('ko-KR'), metacritic optional, korean badge colored
- Feedback: fire-and-forget POST /api/feedback, optimistic UI → 피드백 감사해요
- No emojis per user preference
- Build: /result ○ (Static), 4.8kB ✅

### ✅ Step 6 — 2026-03-13 — Main page UI
- Files: `app/page.tsx` (replaced placeholder), `app/page.module.css` (new)
- Design: PLAY(lime) + FIT(white) logo, dot grid background with vignette, clean form
- Flow: POST /api/steam → POST /api/recommend → sessionStorage → router.push('/result')
- Error messages: all 6 error codes mapped to Korean UI strings
- Accessibility: labels with htmlFor, aria-live polite on error, button disabled states
- User preference: no emojis
- Build: `next build` passes ✅

### ✅ Step 5 — 2026-03-13 — Claude API integration
- Files: `lib/claude.ts` (new), `app/api/recommend/route.ts` (new)
- `getRecommendations(playHistory, candidates)`: calls claude-haiku-4-5, max_tokens 500, exact prompts from SPEC.md
- try-catch + JSON.parse defense → AI_PARSE_FAILURE on failure
- Route merges Claude output with GameCandidate details → RecommendationCard[] with store_url
- Build: `/api/recommend` ƒ (Dynamic) ✅

### ✅ Step 4 — 2026-03-13 — Candidate games (featuredcategories → appdetails + filter)
- Files: `lib/steam.ts`, `app/api/steam/route.ts`
- `getFeaturedAppIds()`: fetches featuredcategories → deduped appids from new_releases + top_sellers
- `getGameDetails(appid)`: fetches appdetails → GameCandidate or null (skips if no price + not free)
- `getCandidateGames(featuredIds, ownedAppIds, budget?)`: sequential fetch with 200ms delay, up to 30 → NO_GAMES_IN_BUDGET if 0
- Route: featuredcategories fetch starts in parallel with vanity resolution (async-parallel pattern)
- Route body now accepts `budget?: number`; response now includes `candidates: GameCandidate[]`
- Build: `next build` passes ✅

### ✅ Step 3 — 2026-03-13 — Owned games + play history extraction
- Files: `lib/steam.ts`, `app/api/steam/route.ts`
- `getOwnedGames(steamId)`: calls GetOwnedGames → PRIVATE_PROFILE / INSUFFICIENT_HISTORY / PlayHistory[]
- Top 15 sorted by playtime_forever desc, converted to hours (÷60, rounded 1dp)
- Route now returns `{ steamId, playHistory }` instead of just `{ steamId }`
- Build: `next build` passes ✅

### ✅ Step 2 — 2026-03-13 — Steam URL parsing + SteamID resolution
- Files: `lib/steam.ts`, `app/api/steam/route.ts`
- `parseSteamUrl()`: `/profiles/{digits}` → direct SteamID64, `/id/{word}` → vanity, else `INVALID_URL`
- `resolveVanityUrl()`: calls ResolveVanityURL API → null on `success !== 1`
- `sleep()` utility added to `lib/steam.ts` (used in Step 4 for rate limiting)
- Build: `next build` passes — Route `/api/steam` ƒ (Dynamic)

### ✅ Step 1 — 2026-03-11 — Next.js 15 App Router init
- Files: `package.json`, `tsconfig.json`, `next.config.js`, `.env.local`, `.eslintrc.json`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder), `types/index.ts`
- Decisions: Vite→Next.js (spec requirement) · Space Grotesk font (Inter/Arial banned by frontend-design rules) · accent `#c8f135` phosphor lime (purple banned) · bg `#09090b` · all shared types pre-defined in `types/index.ts`
- Build: `next build` passes — Route `/` 120B / First Load 102kB

---

## ── PROJECT REFERENCE ────────────────────────────────────

Full spec → `SPEC.md` (read before implementing any step)
