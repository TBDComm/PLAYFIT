# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 107/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see `rules/handover-rules.md` §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

Start work → fill In-Progress Lock. Finish step → clear lock + update Active Step. Non-step change → Minor Changes Log entry. Writing style + compression rules → `rules/handover-rules.md`.

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
| SQ-13 | Phase SQ P3 — `@vercel/og` OG cards (CF Pages compat 확인 선행) | ✅ 2026-04-16 |
| SQ-15 | Phase SQ P3 — IGDB 재평가 (AdSense 승인 게이트) | 🕑 blocked |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: SQ-15 ──

SQ-13 complete (2026-04-16). All Phase SQ P1–P3 steps done except SQ-15 (blocked on AdSense approval).

**SQ-15**: IGDB integration re-evaluation — gated on AdSense approval. Read `SPEC.md §SQ-15` (line 186) when unblocked.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 → 2026-04-08 entries → `HANDOVER-archive.md` (see Section Index)_
_2026-04-11 CE entries → `HANDOVER-archive.md §Minor Changes Log 2026-04-11 (CE-12~CE-31)`_
_2026-04-11~04-13 entries (SQ prep + articles + SQ-1~SQ-8) → `HANDOVER-archive.md §2026-04-11~04-13`_

| Date | Change | Files |
|------|--------|-------|
| 2026-04-15 | feat(SQ-9~SQ-10): CommentsSection — threading, post/delete/report, auth-gated form, a11y | CommentsSection.tsx, page.tsx, page.module.css |
| 2026-04-15 | feat(SQ-11): user_profiles extension + PUT/GET /api/profile + settings profile section | migration, types, api/profile/route.ts, SettingsClient.tsx |
| 2026-04-15 | feat(SQ-12+SQ-14): /users/[userId] public profile + squad history + settings share link | users/[userId]/page.tsx, SettingsClient.tsx |
| 2026-04-15 | ux(SQ-12 polish): host profile link, label clarity, Header profile entry, a11y | supabase.ts, AuthContext, Header, squad/[token], settings |
| 2026-04-16 | feat(SQ-13): OG cards for /squad/[token] and /users/[userId] — `next/og` ImageResponse | opengraph-image.tsx (×2 new) |
| 2026-04-16 | fix(audit): 11 fixes — `req.nextUrl` CF crash, cache() dedup, params await, LIKE escape, parallel, validation, a11y, Anthropic client hoist | 13 files across api/, lib/, app/ |

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
