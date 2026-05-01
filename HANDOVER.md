# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 104/200 lines — OK**
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
STATUS: clear
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
| SQ-ENH-1 | Pairwise match score (lib/squad.ts) | ✅ 2026-04-19 |
| SQ-ENH-2 | Member picks — per-member re-score + Claude reason | ✅ 2026-04-19 |
| SQ-ENH-3 | analysisReason — group taste summary in Claude prompt | ✅ 2026-04-19 |
| SQ-ENH-4 | Steam popular multiplayer section + session naming | ✅ 2026-04-19 |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: none ──

SQ-15 remains blocked (AdSense approval pending). ENH-1~4 complete.
non-step ✅ — Squad CTA → full feature section. Eyebrow + title + feature pills + solid CTA button. `page.tsx` + `page.module.css` updated.
non-step ✅ — Full UX audit complete (20 steps). `UX_NOTES.md` (raw findings) + `UX_BACKLOG.md` (2 HIGH, 7 MEDIUM, 13 LOW items). See `UX_BACKLOG.md` for priorities.
non-step ✅ — UX Backlog H-1+L-1+H-2+M-1: skip link (layout.tsx+globals.css), id="main-content" on all pages (7 files), modal focus return on close+ESC, dynamic hamburger aria-label.
non-step ✅ — UX Backlog M-2~M-7: LibraryPickerModal focus trap + aria-live status, NameSessionForm error state, "가격 정보 없음" plain span (result+squad), CommentsSection inline confirm, Steam URL placeholder.
non-step ✅ — UX Backlog L-2~L-11: CopyUrlButton+NameSessionForm aria-live, type="button" (ScrollToTop+reset-password), Settings char-count aria-describedby, weights button dynamic aria-label, reset-password aria-live, NavLogo width=19 (CLS), CommentsSection reply auto-focus, Squad score DOM order (column-reverse), analysis_reason h2 heading, SavedGames touch hint. L-12 was already done in CSS. L-13 LOCKED.

**ENH-1** ✅ — Pairwise cosine in `analyzeSquad`; single-member edge case returns 100.
**ENH-2** ✅ — Migration `20260419_squad_enh.sql` adds `member_picks`/`analysis_reason` columns. route.ts re-scores per member, top 2 → Claude reasons in same call.
**ENH-3** ✅ — `analysisReason` added to Claude prompt + DB + response.
**ENH-4** ✅ — Migration `20260419_squad_enh4.sql` adds `popular_multiplayer JSONB` + `session_name TEXT`. `getPopularMultiplayerGames()` fetches `tags=1685` (Multi-player), appid extracted from logo URL. Claude + popular fetch run in parallel. Result page renders `analysisReason` → `memberPicks` → `popularMultiplayer` below group cards. Host can name session via `NameSessionForm` → `PATCH /api/squad/[token]`. Profile page shows `session_name` in squad history.

**SQ-15** (still blocked): AdSense approval gate → read `SPEC.md §SQ-15` (line 186) when unblocked.

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
