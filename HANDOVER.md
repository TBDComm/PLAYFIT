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

## ── ACTIVE STEP: SQ-ENH-1~4 (planned, not started) ──

SQ-15 remains blocked (AdSense approval pending). Next work: SQ-ENH-1~4. Implement in order — each step depends on the previous.

**Ask user before starting ENH-2 or ENH-3:** Should `member_picks` and `analysis_reason` be stored in `squad_sessions` DB (requires migration) or returned in API response only (lost on page reload, not shown on shared result link)?

**Ask user before starting ENH-4:** Test-fetch the Steam store search response format before writing any code: `store.steampowered.com/search/results/?tags=1191&sort_by=Reviews_DESC&json=1` — confirm field names and appid extraction path.

**ENH-1** — `lib/squad.ts` only. Replace group-cosine with pairwise: member i score = avg cosine similarity vs all j≠i. Keep `mergeTagProfiles` and candidate scoring unchanged. No DB, API, or UI change. After completing: verify `avgMatchScore` still rounds correctly and update any tests.

**ENH-2** — `app/api/squad/route.ts`, `lib/claude.ts`, `types/index.ts`. Re-score candidates per member using individual `tagProfile` (not merged). Top 2 non-overlapping with group recs → Claude generates pick cards with `reason`. Add `memberPicks: Record<string, SquadRecommendationCard[]>` to API response type. Does NOT include UI changes (those land in ENH-4).

**ENH-3** — `lib/claude.ts` only. Add `analysisReason: string` to `getSquadRecommendations` return — 1–2 sentences from `topSharedTags` / `conflictTags`. No extra Claude API call; extend existing prompt. Does NOT include UI changes (those land in ENH-4).

**ENH-4** — `app/api/squad/route.ts`, result page, `types/index.ts`. Fetch Steam store top multiplayer → price via existing cache → 3–5 picks not in group recs or member picks → `popularMultiplayer: SquadRecommendationCard[]`. UI: render all new sections below existing 5 cards in order: `analysisReason` → `memberPicks` → `popularMultiplayer`.

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
