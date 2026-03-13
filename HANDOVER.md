# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 118/200 lines — OK**
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

## ── 🔒 IN-PROGRESS LOCK ──────────────────────────────────

**Check this first. If filled, a previous session was interrupted — resume from here.**

```
STATUS: CLEAR — no work in progress
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
| 3 | Owned games + play history extraction (top 15) | ⬜ |
| 4 | Candidate games (featuredcategories → appdetails + filter) | ⬜ |
| 5 | Claude API integration | ⬜ |
| 6 | Main page UI | ⬜ |
| 7 | Result page UI (5 cards) | ⬜ |
| 8 | Supabase client + feedback route | ⬜ |
| 9 | All error codes wired | ⬜ |
| 10 | output: 'edge' + Cloudflare Pages build | ✅ 2026-03-13 |

**Key readiness:**
```
STEAM_API_KEY=           ✅ set
ANTHROPIC_API_KEY=       ← needed for Step 5
NEXT_PUBLIC_SUPABASE_URL=      ← needed for Step 8
NEXT_PUBLIC_SUPABASE_ANON_KEY= ← needed for Step 8
```
Never mock or hardcode when a key is missing — stop and ask the user.

---

## ── ACTIVE STEP: Step 3 ──────────────────────────────────

**Files to modify:** `lib/steam.ts`, `app/api/steam/route.ts`

**Goal:** Given SteamID64 → call GetOwnedGames → return top 15 games by playtime.

**GetOwnedGames:**
```
GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
params: key, steamid, include_appinfo=true, include_played_free_games=true
```
- `response.games` empty or undefined → `PRIVATE_PROFILE`
- total games < 5 → `INSUFFICIENT_HISTORY`
- Fields: `appid`, `name`, `playtime_forever` (minutes)
- Return top 15 sorted by `playtime_forever` desc → convert to `PlayHistory[]` (÷60 for hours)

**Scope boundary:** Step 3 does NOT implement featuredcategories or appdetails (Step 4).

**After completing:** mark Step 3 ✅, move this section to Completed Steps, write Step 4 instructions here.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

| Date | Change | Files |
|------|--------|-------|
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
