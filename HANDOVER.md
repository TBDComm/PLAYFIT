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
| 2 | Steam URL parsing + SteamID resolution | ⏳ blocked |
| 3 | Owned games + play history extraction (top 15) | ⬜ |
| 4 | Candidate games (featuredcategories → appdetails + filter) | ⬜ |
| 5 | Claude API integration | ⬜ |
| 6 | Main page UI | ⬜ |
| 7 | Result page UI (5 cards) | ⬜ |
| 8 | Supabase client + feedback route | ⬜ |
| 9 | All error codes wired | ⬜ |
| 10 | output: 'edge' + Cloudflare Pages build | ⬜ |

**Blocker:** `STEAM_API_KEY` not issued → user must get it at https://steamcommunity.com/dev/apikey and set it in `.env.local`.

**Key readiness:**
```
STEAM_API_KEY=           ← needed for Step 2
ANTHROPIC_API_KEY=       ← needed for Step 5
NEXT_PUBLIC_SUPABASE_URL=      ← needed for Step 8
NEXT_PUBLIC_SUPABASE_ANON_KEY= ← needed for Step 8
```
Never mock or hardcode when a key is missing — stop and ask the user.

---

## ── ACTIVE STEP: Step 2 ──────────────────────────────────

**Pre-flight:** confirm `STEAM_API_KEY` is set in `.env.local`. If empty, stop and tell the user:
> "Steam API 키가 필요합니다. https://steamcommunity.com/dev/apikey 에서 발급 후 .env.local의 STEAM_API_KEY에 입력해주세요."

**Files to create:** `lib/steam.ts`, `app/api/steam/route.ts`

**URL parsing logic:**
```
/profiles/(\d+)  → SteamID64 direct, skip API call
/id/(\w+)        → call ResolveVanityURL
anything else    → return INVALID_URL
```

**ResolveVanityURL:** `GET /ISteamUser/ResolveVanityURL/v1/?key=…&vanityurl=…` → `success !== 1` → `INVALID_URL`

**`sleep` utility** (add to `lib/steam.ts` — used in Step 4 for rate limiting):
```typescript
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
```

**Scope boundary:** Step 2 does NOT implement GetOwnedGames (Step 3) or appdetails loop (Step 4).

**After completing:** mark Step 2 ✅, move this section to Completed Steps, write Step 3 instructions here.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

| Date | Change | Files |
|------|--------|-------|
| — | No minor changes yet | — |

---

## ── COMPLETED STEPS ──────────────────────────────────────

### ✅ Step 1 — 2026-03-11 — Next.js 15 App Router init
- Files: `package.json`, `tsconfig.json`, `next.config.js`, `.env.local`, `.eslintrc.json`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder), `types/index.ts`
- Decisions: Vite→Next.js (spec requirement) · Space Grotesk font (Inter/Arial banned by frontend-design rules) · accent `#c8f135` phosphor lime (purple banned) · bg `#09090b` · all shared types pre-defined in `types/index.ts`
- Build: `next build` passes — Route `/` 120B / First Load 102kB

---

## ── PROJECT REFERENCE ────────────────────────────────────

Full spec → `SPEC.md` (read before implementing any step)
