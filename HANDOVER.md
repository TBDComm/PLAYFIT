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
| B5 | Update `/api/recommend` — all four auth cases | ✅ 2026-03-16 |
| B6 | Update `/api/feedback` — user_id if session, steam_id if not | ✅ 2026-03-16 |
| B7 | Update Header (Steam link button) + main page layout per auth state | ✅ 2026-03-16 |
| B8–B10 | E2E tests (email, Steam, non-auth) | ⬜ |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ACTIVE STEP: B8–B10 — E2E tests ────────

Read `SPEC.md §B8–B10` before implementing.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-B5 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-16 | B5: /api/recommend — session read + weights by user_id (logged-in) or steam_id (anon) | `app/api/recommend/route.ts`, `lib/supabase.ts` |
| 2026-03-16 | B6: /api/feedback — session read + feedback user_id + weights upsert by user_id or steam_id | `app/api/feedback/route.ts` |
| 2026-03-16 | B7: Header email OTP + Steam link popup + page.tsx auth-aware URL/button | `Header.tsx`, `Header.module.css`, `page.tsx`, `page.module.css` |
| 2026-03-16 | Fix: useEffect Escape handlers — inline setters instead of closeModal/closePopup refs | `Header.tsx` |

---

## ── COMPLETED STEPS ──────────────────────────────────────

### ✅ B7 — 2026-03-16 — Header + login modal + Steam link popup + page auth UI
- Files: `Header.tsx`, `Header.module.css`, `page.tsx`, `page.module.css`
- Header: 3 auth states; email OTP (`signInWithOtp`/`verifyOtp`); Steam link popup (auto-open after Google/email login)
- page.tsx: `authState` from user_profiles; Steam auth → hides URL input, button "내 게임 추천받기"; linked → pre-fills URL
- Build: `tsc --noEmit` passed ✅

### ✅ B6 — 2026-03-16 — /api/feedback session-aware
- Files: `app/api/feedback/route.ts`
- Changes: `createServerClient` reads session; feedback insert includes `user_id`; weights upsert on `user_id,tag` (logged-in) or `steam_id,tag` (anon)
- Build: `tsc --noEmit` passed ✅

### ✅ B5 — 2026-03-16 — /api/recommend four auth cases
- Files: `app/api/recommend/route.ts`, `lib/supabase.ts`
- Changes: `createServerClient` reads session; weights by `user_id` (Cases 1–3, logged in) or `steam_id` (Case 4, anon); `getUserTagWeights` gains `by` param
- Build: `tsc --noEmit` passed ✅

### ✅ B4 + B4-link — 2026-03-16 — Steam OpenID auth
- Files: `app/api/auth/steam/route.ts`, `app/api/auth/steam/callback/route.ts`, `app/api/auth/link-steam/route.ts`
- Decisions: `generateLink({ type: 'magiclink' })` → redirect to action_link → session set via existing `/api/auth/callback`
- Build: `tsc --noEmit` passed ✅

- B3 archived → see HANDOVER-archive.md
- B1+B2 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
