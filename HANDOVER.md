# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 104/200 lines — OK**
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
| **PRE-SQ: AdSense Articles** | **Blog/articles section — AdSense approval prerequisite** | ✅ 2026-04-12 |
| SQ-1~SQ-6 | Phase SQ P1 — Squad MVP (taste-based LFG) | ⏳ next |
| SQ-7~SQ-10 | Phase SQ P2 — Game Boards | 🕑 future |
| SQ-11~SQ-15 | Phase SQ P3 — Public Profiles + viral OG + IGDB | 🕑 future |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: SQ-1 ──

PRE-SQ complete (2026-04-12). 19 posts live at /blog (14 articles merged into blog). Read SPEC.md §SQ-1 before starting.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 → 2026-04-08 entries → `HANDOVER-archive.md` (see Section Index)_
_2026-04-11 CE entries (CE-12~CE-31) → `HANDOVER-archive.md §Minor Changes Log 2026-04-11 (CE-12~CE-31)`_

| Date | Change | Files |
|------|--------|-------|
| 2026-04-11 | docs(SQ): Phase SQ spec added; SQUAD_FEATURE.md deleted; HANDOVER/SPEC restructured with section indexes; memory/project_stack.md carved out; CLAUDE.md token-efficient reading + rule summaries | SPEC.md, SPEC_archive.md, HANDOVER-archive.md, CLAUDE.md, MEMORY.md, memory/project_stack.md |
| 2026-04-11 | plan(PRE-SQ): AdSense articles step added before SQ; ACTIVE STEP updated; memory/project_adsense_plan.md created | HANDOVER.md, MEMORY.md, memory/project_adsense_plan.md |
| 2026-04-12 | fix: login modal not closing after auth — added direct closeLoginModal() call on success in handleSignIn, handleVerifyOtp, Google GIS callback (was relying solely on indirect SIGNED_IN → fetchSteamId → authState chain) | app/components/Header.tsx |
| 2026-04-12 | feat(PRE-SQ): /articles section — 14 Korean game recommendation articles (TSX registry, no MDX), list + detail pages, sitemap, Footer nav link | lib/articles.ts, content/articles/*.tsx (14), app/articles/**, app/sitemap.ts, app/components/Footer.tsx |
| 2026-04-12 | refactor(articles): remove AI smell — delete metadata blocks, diversify 14 article endings, fix negative→positive patterns, replace repetitive phrases ("기준점"·"압도적"·"최적화"), vary game description lengths; fix one "기준점" in blog/best-rpg | content/articles/*.tsx (14), content/blog/best-rpg-games-steam-2026.tsx |
| 2026-04-12 | content: expand all 14 articles + 5 blog posts — +30~50% length, strengthen human feel (specific game experiences, scene references, honest downsides), add games and sections, AdSense approval goal; fix [slug]/page.tsx runtime='edge' conflict with generateStaticParams | content/articles/*.tsx (14), content/blog/*.tsx (5), app/articles/[slug]/page.tsx |
| 2026-04-12 | refactor(content): AI detector pattern removal — typo fix (돌아다리는), 첫째/둘째 prose structure, "조화롭습니다", triple-adjective chains, duplicate sentences across files (Phasmophobia×2, Slay유사작×3, Disco Elysium×2, indie-closing), RTS intro rewrite | content/articles/open-world-games, strategy-games, coop-games, rpg-guide, indie-hidden-gems; content/blog/steam-genre-guide-action, indie-games-hidden-gems, best-rpg-games-steam-2026 |
| 2026-04-12 | refactor: /articles → /blog merge — 14 articles absorbed into blog registry (date→publishedAt), 301 redirect from /articles/*, app/articles/ route deleted, Footer link consolidated, sitemap cleaned; lib/articles.ts kept as ArticleMeta type shim | lib/blog.ts, lib/articles.ts, next.config.js, app/blog/[slug]/page.tsx, app/blog/page.module.css, app/sitemap.ts, app/components/Footer.tsx |
| 2026-04-12 | fix: scoreCandidates RPC error silently returned [] → candidates=[] → misleading 400 NO_GAMES_IN_BUDGET ("raise budget" message); changed to throw so route's catch returns 500 GENERAL_ERROR ("try again later"); added scored.length===0 guard | lib/supabase.ts, app/api/generate-recommendation/route.ts |

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
