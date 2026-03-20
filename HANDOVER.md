# PLAYFIT Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 122/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see rules/handover-rules.md §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

| Situation | Action |
|-----------|--------|
| Starting any work | Fill In-Progress Lock immediately |
| Completing a step | Clear lock → add Completed Step entry → update Active Step |
| Non-step change (bug, config, style) | Clear lock → add Minor Changes Log entry |
| Session interrupted | Leave lock filled — next session resumes from it |
| Writing ANY text to this file | **English by default** — Korean only when genuinely necessary (Korean-specific context, UI label references). Do not default to Korean out of habit. |

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
| B8–B10 | E2E tests (email, Steam, non-auth) | ✅ |
| C1 | SEO foundation — robots.ts, sitemap.ts, OG/Twitter meta tags | ✅ 2026-03-18 |
| C2 | Legal pages — /privacy, /terms, Footer component | ✅ 2026-03-18 |
| C3 | GA4 Analytics — gtag.js + 5 events | ✅ 2026-03-19 |
| C4 | Site Architecture — sticky nav bar, Breadcrumb, /genre index, /users/[userId] reserved | ✅ 2026-03-20 |
| C5 | Game detail pages `/games/[appid]` — ISR 86400s, similar games TOP 10, SEO, noindex guard | ✅ 2026-03-20 |
| C6 | Genre hub pages `/genre/[slug]` — ISR 86400s, top 20 by tag sum, ItemList JSON-LD, community placeholder | ✅ 2026-03-20 |
| C7 | Blog section `/blog` + `/blog/[slug]` — TSX content components, BlogPosting JSON-LD, sitemap updated | ✅ 2026-03-20 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ACTIVE STEP: C8 — AdSense Integration ──────────────────

Read relevant section of `SPEC.md` before implementing.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-B5 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
_2026-03-16~18 B-series + C1/C2 entries → HANDOVER-archive.md_
| 2026-03-18 | UI: legal page logo, result card thumbnails + Metacritic score tiers | `privacy/page.tsx`, `terms/page.tsx`, `result/page.tsx`, `result/page.module.css`, `layout.tsx` |
| 2026-03-18 | Fix: search debounce 300ms → 150ms; race condition via searchGenRef | `page.tsx` |
| 2026-03-19 | C3: GA4 gtag.js + 5 events; NEXT_PUBLIC_GA_MEASUREMENT_ID added to CF Pages ✅ | `layout.tsx`, `lib/analytics.ts`, `page.tsx`, `result/page.tsx`, `Header.tsx` |
| 2026-03-19 | UI: result page — thumbnail height:auto no-crop, card max-height via cqw, padding 14%, logo outside .inner, guideline fixes | `result/page.tsx`, `result/page.module.css` |
| 2026-03-20 | UI: replace all button transparent backgrounds with var(--bg-elevated) — logoutBtn, steamLinkBtn, closeBtn, inlineLink, footerLink, toggleCheckbox | `Header.module.css`, `page.module.css` |
| 2026-03-20 | UI: footerLink → full button (border, padding, hover); closeBtn → border added; authFooter → bg-elevated | `Header.module.css` |
| 2026-03-20 | C4: Header → sticky nav bar (logo + nav links + auth + mobile hamburger); Footer + Blog/Genre links; Breadcrumb component; /genre index page; /users/[userId] reserved | `Header.tsx`, `Header.module.css`, `Footer.tsx`, `Breadcrumb.tsx` (new), `Breadcrumb.module.css` (new), `app/genre/page.tsx` (new), `app/genre/page.module.css` (new), `app/users/[userId]/page.tsx` (new) |
| 2026-03-20 | C5: `/games/[appid]` — ISR 86400s, similar games TOP 10 via score_candidates RPC, SoftwareApplication JSON-LD, noindex thin content guard; sitemap updated with top 5000 games | `app/games/[appid]/page.tsx` (new), `app/games/[appid]/page.module.css` (new), `app/sitemap.ts` |
| 2026-03-20 | C6: `/genre/[slug]` — ISR 86400s, top 20 by tag vote sum, rank numbers, ItemList JSON-LD, community placeholder, CTA | `app/genre/[slug]/page.tsx` (new), `app/genre/[slug]/page.module.css` (new) |
| 2026-03-20 | Fix: CF Pages build failure — added `export const runtime = 'edge'` to all dynamic routes | `app/games/[appid]/page.tsx`, `app/genre/[slug]/page.tsx`, `app/users/[userId]/page.tsx` |
| 2026-03-20 | C7: Blog section — TSX content approach (no fs/MDX, edge-safe); 3 posts; BlogPosting JSON-LD; sitemap updated | `lib/blog.ts` (new), `content/blog/*.tsx` (3 new), `app/blog/page.tsx` (new), `app/blog/[slug]/page.tsx` (new), `app/sitemap.ts` |
| 2026-03-20 | Fix: blog/[slug] — remove generateStaticParams (Next.js rejects edge runtime + generateStaticParams together) | `app/blog/[slug]/page.tsx` |
| 2026-03-20 | UI: remove nav bar; auth buttons → fixed top-right float; NavLogo → fixed top-left; home page: no logo | `app/layout.tsx`, `Header.tsx`, `Header.module.css`, `NavLogo.tsx`, `NavLogo.module.css` |
| 2026-03-20 | UI: home page — genre + blog links moved to top-left; accent colored text (opacity 0.6→1 on hover) | `app/page.tsx`, `app/page.module.css` |
| 2026-03-20 | UI: genre page — fixed card size via aspect-ratio 5/2 + font-size clamp(cqi) for auto text scaling | `app/genre/page.module.css` |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
