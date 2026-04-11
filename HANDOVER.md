# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 100/200 lines — OK**
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
| **SQ-1~SQ-6** | **Phase SQ P1 — Squad MVP (taste-based LFG)** | ⏳ planned |
| SQ-7~SQ-10 | Phase SQ P2 — Game Boards | 🕑 future |
| SQ-11~SQ-15 | Phase SQ P3 — Public Profiles + viral OG + IGDB | 🕑 future |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: SQ-series planning ──

All CE items complete (2026-04-11). Next: **Phase SQ — Community Expansion**.

- Active spec → `SPEC.md §Phase SQ` (Section Index at lines 30–44 — use `Read(offset, limit)` per step)
- Approved plan detail → `/home/user/.claude/plans/purrfect-mapping-pelican.md`

**Implementation order (P1):** SQ-1 → SQ-2 → SQ-3 → SQ-4 → SQ-6 → SQ-5.
**Next work:** begin SQ-1 when user gives the go-ahead.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 → 2026-04-08 entries → `HANDOVER-archive.md` (see Section Index)_
_2026-04-11 CE entries (CE-12~CE-31) → `HANDOVER-archive.md §Minor Changes Log 2026-04-11 (CE-12~CE-31)`_

| Date | Change | Files |
|------|--------|-------|
| 2026-04-11 | docs(SQ): Phase SQ spec added; SQUAD_FEATURE.md deleted; HANDOVER/SPEC restructured with section indexes; memory/project_stack.md carved out; CLAUDE.md token-efficient reading + rule summaries | SPEC.md, SPEC_archive.md, HANDOVER-archive.md, CLAUDE.md, MEMORY.md, memory/project_stack.md |

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
