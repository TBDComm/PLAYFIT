# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 124/200 lines — OK**
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

`next dev` auto-start disabled via `.idx/dev.nix`. If firebase/nixd running: `kill $(pgrep -f firebase) $(pgrep -f nixd) 2>/dev/null`. If VM crashes → RESTART workspace.

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
| A1–A10 | Supabase DB, tag-based Claude, manual mode, search, E2E tests | ✅ 2026-03-13–16 |
| A7-1 | Korean game name search — removed (Steam API returns empty server-side) | ❌ 2026-03-16 |
| B1 | Create `user_profiles` table | ✅ 2026-03-16 |
| B2 | Alter `user_tag_weights` + `feedback` (add user_id, keep steam_id) | ✅ 2026-03-16 |
| B3 | Google auth — Header, login modal, auth callback, logout | ✅ 2026-03-16 |
| B4 | Steam OpenID — `/api/auth/steam` + callback | ✅ 2026-03-16 |
| B4-link | `/api/auth/link-steam` — Steam URL → migrate weights to user_id | ✅ 2026-03-16 |
| B5 | Update `/api/recommend` — all four auth cases | ⬜ |
| B6 | Update `/api/feedback` — user_id if session, steam_id if not | ⬜ |
| B7 | Update Header (Steam link button) + main page layout per auth state | ⬜ |
| B8–B10 | E2E tests (email, Steam, non-auth) | ⬜ |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ACTIVE STEP: B5 — Update `/api/recommend` (four auth cases) ────────

Read `SPEC.md §B5` before implementing.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-14 + 2026-03-15 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-16 | Search debounce 300ms→0ms + missing debounceRefs (lost in crash) | `app/page.tsx` |
| 2026-03-16 | A7-1 Korean search: add + remove (Steam Suggest API returns empty server-side) | `app/api/search/route.ts`, `app/page.tsx` |
| 2026-03-16 | Fix: .dropdownItem missing from prefers-reduced-motion block | `app/page.module.css` |
| 2026-03-16 | Dead code cleanup: unused types + remove @anthropic-ai/sdk from package.json | `types/index.ts`, `lib/claude.ts`, `lib/steam.ts`, `package.json` |
| 2026-03-16 | Revised B-series spec: steam_id kept, B4-link step added, four auth cases | `SPEC.md`, `HANDOVER.md` |
| 2026-03-16 | B2: ADD user_id UUID to user_tag_weights (+ unique constraint) + feedback | Supabase SQL |
| 2026-03-16 | Install @supabase/auth-helpers-nextjs + @supabase/ssr (B3 auth deps) | `package.json` |
| 2026-03-16 | B3: Header + Google OAuth modal + auth callback route + layout | `app/components/Header.tsx`, `Header.module.css`, `app/api/auth/callback/route.ts`, `app/layout.tsx` |
| 2026-03-16 | Guidelines updated from vercel-labs/agent-skills react-best-practices | `rules/async-parallel.md`, `rules/bundle-barrel-imports.md`, `rules/rerender-optimization.md` (new), `CLAUDE.md` |
| 2026-03-16 | Fix: supabase useMemo([]) in Header + :focus-visible on all 5 buttons | `app/components/Header.tsx`, `app/components/Header.module.css` |

---

## ── COMPLETED STEPS ──────────────────────────────────────

### ✅ B4 + B4-link — 2026-03-16 — Steam OpenID auth
- Files: `app/api/auth/steam/route.ts`, `app/api/auth/steam/callback/route.ts`, `app/api/auth/link-steam/route.ts`
- Decisions: `generateLink({ type: 'magiclink' })` → redirect to action_link → session set via existing `/api/auth/callback`
- Build: `tsc --noEmit` passed ✅

### ✅ B3 — 2026-03-16 — Header + Google OAuth modal + auth callback
- Files: `app/components/Header.tsx`, `app/components/Header.module.css`, `app/api/auth/callback/route.ts`, `app/layout.tsx`
- Decisions: `createBrowserClient` used (not `createClientComponentClient` — not exported in v0.15); `@supabase/ssr` v0.9 uses `getAll`/`setAll` not `get`/`set`; `NextRequest` needed in callback to access `cookies.getAll()`
- Watch out: Steam button in modal redirects to `/api/auth/steam` (B4); email login deferred to post-MVP
- Build: `tsc --noEmit` passed ✅

### ✅ B1 + B2 — 2026-03-16 — Supabase schema additions
- SQL only: `user_profiles` table created; `user_id UUID` added to `user_tag_weights` (+ unique constraint on user_id+tag) + `feedback`
- Decisions: `steam_id` kept in `user_tag_weights` — pre-login weights migrate on B4-link (`UPDATE ... WHERE user_id IS NULL`)
- Build: no code changes; SQL run in Supabase dashboard ✅

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
