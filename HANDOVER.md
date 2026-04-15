# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 105/200 lines — OK**
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
| **SQ-11~SQ-15** | **Phase SQ P3 — Public Profiles + viral OG + IGDB** | ⏳ next |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: SQ-11~SQ-15 ──

SQ-9~SQ-10 complete (2026-04-15). All SQ P2 (Game Boards) done.

Next: SQ-11~SQ-15 Public Profiles + viral OG + IGDB — read `SPEC.md §Phase SQ` (lines 180–187) before starting.

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
| 2026-04-12 | feat(SQ-1~SQ-6): Squad MVP — DB migration, lib/squad.ts pure functions, Claude Squad helper, /api/squad route, /squad input page, /squad/[token] share page, home CTA; guideline pass (h1 추가, touch-action, name attr, import 중복 제거); tsc clean | supabase/migrations/20260412_squad.sql, lib/squad.ts, lib/claude.ts, lib/supabase.ts, types/index.ts, app/api/squad/route.ts, app/squad/**, app/squad/[token]/**, app/page.tsx, app/page.module.css, app/components/RecommendationForm.tsx |
| 2026-04-13 | feat(SQ-7): game_comments DB migration — 500 char limit, parent_id 1-level replies, RLS (public read / auth write / owner delete) | supabase/migrations/20260413_game_comments.sql |
| 2026-04-13 | feat(SQ-8): /api/games/[appid]/comments GET/POST/DELETE edge route — rate limit 5/hr, RLS double-guard; GameComment type added; tsc clean | app/api/games/[appid]/comments/route.ts, types/index.ts |
| 2026-04-15 | feat(SQ-9~SQ-10): CommentsSection client component — fetch on mount, root+reply threading, post/delete/report(mailto), auth-gated form; CSS + reduced-motion + a11y; tsc clean | app/games/[appid]/CommentsSection.tsx (new), page.tsx, page.module.css |

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
