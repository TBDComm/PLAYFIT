# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 130/200 lines — OK**
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
| **PRE-SQ: AdSense Articles** | **Blog/articles section — AdSense approval prerequisite** | ⏳ next |
| SQ-1~SQ-6 | Phase SQ P1 — Squad MVP (taste-based LFG) | 🕑 after PRE-SQ |
| SQ-7~SQ-10 | Phase SQ P2 — Game Boards | 🕑 future |
| SQ-11~SQ-15 | Phase SQ P3 — Public Profiles + viral OG + IGDB | 🕑 future |

Env vars + Supabase tables state → `memory/project_stack.md` (read only when touching infra).

---

## ── ACTIVE STEP: PRE-SQ — AdSense Articles ──

CE complete (2026-04-11). Full spec is inlined below — do NOT read SPEC.md for this step.

**Goal:** Add original written content so Google AdSense approves the site.

**Tech spec:**
- Package: `@next/mdx` + `@mdx-js/loader` + `@mdx-js/react`
- MDX files: `/content/articles/[slug].mdx`
- Routes: `/articles` (list page) + `/articles/[slug]` (detail page)
- Both pages: static generation (`generateStaticParams`) — CF Pages compatible
- Each article frontmatter: `title`, `description`, `date`, `slug`
- Article list page: title + description + date, sorted by date desc
- Article detail page: full MDX render + SEO meta tags

**Article list (Claude writes all — 14 articles):**

| slug | title |
|------|-------|
| `solo-games` | 혼자 하기 좋은 게임 추천 TOP 10 |
| `coop-games` | 친구랑 같이 하기 좋은 협동 게임 추천 |
| `free-steam-games` | 스팀 무료 게임 추천 (2025) |
| `budget-games` | 가성비 스팀 게임 추천 |
| `indie-hidden-gems` | 인디 게임 숨겨진 명작 추천 |
| `rpg-guide` | RPG 게임 추천 — 입문자부터 하드코어까지 |
| `horror-games` | 공포 게임 추천 모음 |
| `strategy-games` | 전략 게임 추천 — 두뇌 쓰는 게임 |
| `relaxing-games` | 힐링 게임 추천 — 스트레스 풀리는 게임 |
| `fps-guide` | FPS 게임 추천 — 총게임 입문 가이드 |
| `roguelike-games` | 로그라이크 게임 추천 |
| `open-world-games` | 오픈 월드 게임 추천 |
| `steam-sale-guide` | 스팀 할인 공략법 — 최저가로 게임 사는 법 |
| `guildeline-guide` | 태그로 내 취향 게임 찾기 — Guildeline 활용법 |

**Done criteria:** all 14 MDX files written + list/detail pages render + `npx tsc --noEmit` clean.

**SQ order unchanged:** PRE-SQ complete → SQ-1 → SQ-2 → SQ-3 → SQ-4 → SQ-6 → SQ-5.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-28 → 2026-04-08 entries → `HANDOVER-archive.md` (see Section Index)_
_2026-04-11 CE entries (CE-12~CE-31) → `HANDOVER-archive.md §Minor Changes Log 2026-04-11 (CE-12~CE-31)`_

| Date | Change | Files |
|------|--------|-------|
| 2026-04-11 | docs(SQ): Phase SQ spec added; SQUAD_FEATURE.md deleted; HANDOVER/SPEC restructured with section indexes; memory/project_stack.md carved out; CLAUDE.md token-efficient reading + rule summaries | SPEC.md, SPEC_archive.md, HANDOVER-archive.md, CLAUDE.md, MEMORY.md, memory/project_stack.md |
| 2026-04-11 | plan(PRE-SQ): AdSense articles step added before SQ; ACTIVE STEP updated; memory/project_adsense_plan.md created | HANDOVER.md, MEMORY.md, memory/project_adsense_plan.md |
| 2026-04-12 | fix: login modal not closing after auth — added direct closeLoginModal() call on success in handleSignIn, handleVerifyOtp, Google GIS callback (was relying solely on indirect SIGNED_IN → fetchSteamId → authState chain) | app/components/Header.tsx |

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
