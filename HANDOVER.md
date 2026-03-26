# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 142/200 lines — OK**
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
| C4 | Site Architecture — Breadcrumb, /genre index, /users/[userId] reserved (nav bar subsequently removed — no sticky bar anywhere; auth buttons float top-right in Header.tsx) | ✅ 2026-03-20 |
| C5 | Game detail pages `/games/[appid]` — ISR 86400s, similar games TOP 10, SEO, noindex guard | ✅ 2026-03-20 |
| C6 | Genre hub pages `/genre/[slug]` — ISR 86400s, top 20 by tag sum, ItemList JSON-LD, community placeholder | ✅ 2026-03-20 |
| C7 | Blog section `/blog` + `/blog/[slug]` — TSX content components, BlogPosting JSON-LD, sitemap updated | ✅ 2026-03-20 |
| C8 | AdSense script (`layout.tsx`), `AdUnit.tsx` component, `ads.txt` placeholder — Publisher ID pending AdSense approval | ✅ 2026-03-20 |
| C9 | Ad placement — game detail (after similar games), genre hub (after item 10), blog post (end of post), result (below cards), blog index (below fold) | ✅ 2026-03-20 |
| C10 | Schema Markup — JsonLd.tsx component; @graph on all pages: WebApplication+Organization+WebSite (main), VideoGame+FAQPage+BreadcrumbList (game), CollectionPage+BreadcrumbList (/genre index), ItemList+BreadcrumbList (genre slug), Blog+BreadcrumbList (/blog index), BlogPosting+BreadcrumbList (blog post) | ✅ 2026-03-20, updated 2026-03-26 |
| C11 | On-Page SEO — meta title templates (main/blog post fixed), H1 logo GUILDELINE fix, blog internal links to /genre + / | ✅ 2026-03-20 |
| C12 | AI SEO — FAQ block on game pages, definition block on genre pages, dateModified in all schemas, updatedAt on blog posts | ✅ 2026-03-20 |
| C13 | Core Web Vitals — `<Image unoptimized>` (CF Pages constraint), `requestIdleCallback` for analytics (INP), ad minHeight wrapper (CLS) | ✅ 2026-03-20 |
| FT1–FT6 | Home preview strip, genre index, blog posts, etc. | ✅ 2026-03-21 |
| FT7 | Save recommendations — saved_games table, API routes, result save toggle, home saved section | ✅ 2026-03-23 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳ (pending AdSense approval — add to CF Pages when Publisher ID received)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅ · `saved_games` ✅

---

## ── ACTIVE STEP: NONE — AWAIT USER DIRECTION ────

**FT done:** FT1✅ FT2✅ FT3✅ FT4✅ FT5✅ FT6✅ FT7✅
**SPEC.md §Phase 6 ends at FT7 — no next step is defined yet.**
Do NOT read SPEC.md or infer a next step. Ask the user what to work on next.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-2026-03-21 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-21 | feat(FT2): genre index — count per genre, sort by count desc, top 12 featured 3-col grid, stat line | app/genre/page.tsx, app/genre/page.module.css |
| 2026-03-21 | feat(FT4): 2 new blog posts — action guide 10선, indie hidden gems 10선; registry updated | content/blog/steam-genre-guide-action.tsx, content/blog/indie-games-hidden-gems.tsx, lib/blog.ts |
| 2026-03-21 | feat(FT6): preview section redesign — 8-tile horizontal scroll strip + hover tag chips + saved games placeholder shell; removed dead previewCard CSS | app/page.tsx, app/page.module.css |
| 2026-03-23 | feat(FT7): save recommendations — API routes (GET/POST/DELETE), result ★/☆ optimistic toggle, home saved section activated (skeleton/anon/empty/live cards + unsave), Header open-login event | 8 files |
| 2026-03-23 | feat: LoadingOverlay redesign — glitch wordmark entrance + radar sweep + terminal log; PageLoading (server) for page transitions; loading.tsx added to games/[appid], genre/[slug], genre, blog/[slug], blog | 9 files |
| 2026-03-23 | fix: LoadingOverlay — glitchIn filter:blur() → removed; barFill width → transform:scaleX() (compositor-friendly) | LoadingOverlay.module.css |
| 2026-03-23 | fix: polish — '...'→'…', saveBtnSaved hover, savedLoginBtn touch-action, savedCardUnsaveBtn focus-visible, HANDOVER saved_games | 4 files |
| 2026-03-23 | feat: preview section — portrait grid (library_600x900.jpg), 5-col grid wrapping, bottom-gradient hover overlay | app/page.tsx, app/page.module.css |
| 2026-03-23 | feat: preview rotation — PREVIEW_POOL 22 games, show 15, random 1-tile swap every 2.8s + fade; result save button shown for anon users (triggers open-login event) | app/page.tsx, app/page.module.css, app/result/page.tsx |
| 2026-03-23 | fix: guideline violations — filter→opacity on previewTileImg hover (compositor), previewTile added to reduced-motion block, JS interval gated on matchMedia, HANDOVER log English | app/page.tsx, app/page.module.css, HANDOVER.md |
| 2026-03-25 | refactor: marketing-skills — 9 irrelevant skill dirs deleted, 12 kept skills merged into SEO-SKILLS.md (750 lines), REMOVED.md updated | marketing-skills/SEO-SKILLS.md, marketing-skills/REMOVED.md |
| 2026-03-25 | fix(SEO): sitemap /genre missing; robots.txt add ChatGPT-User + anthropic-ai; remove broken SearchAction schema; H1 srOnly keyword; FAQPage schema + 2nd Q&A on game pages; result noindex layout; blog+genre JSON-LD; layout OG image field | app/sitemap.ts, app/robots.ts, app/layout.tsx, app/page.tsx, app/page.module.css, app/games/[appid]/page.tsx, app/result/layout.tsx, app/blog/page.tsx, app/genre/page.tsx |
| 2026-03-25 | chore(SEO): full audit against SEO-SKILLS.md — findings saved to memory/project_seo_pending.md | memory/project_seo_pending.md, memory/MEMORY.md |
| 2026-03-25 | fix(SEO): P1–P3 pending tasks — BlogPosting image+publisher+Person author, blog post OG image, VideoGame schema, Steam CDN OG image on game pages, root/blog/genre meta descriptions, blog index title, genre definition block | 6 files |
| 2026-03-25 | feat(SEO): OG image + favicon via ImageResponse — opengraph-image.tsx (1200×630), icon.tsx (32×32), apple-icon.tsx (180×180); /og-image.png refs → /opengraph-image | app/opengraph-image.tsx, app/icon.tsx, app/apple-icon.tsx, app/layout.tsx, app/blog/[slug]/page.tsx |
| 2026-03-25 | fix(favicon): square bg → transparent + hex solid fill — favicon/apple-icon now render as hexagon shape; image-guildeline synced to confirmed design | app/icon.tsx, app/apple-icon.tsx, image-guildeline/favicon.tsx, image-guildeline/apple-icon.tsx, image-guildeline/LOGO_INSTRUCTIONS.md |
| 2026-03-25 | fix(SEO): Bingbot added to robots.ts; genre/[slug] OG image added; blog post OG image width/height added; MEMORY.md SEO pending reference cleaned up | app/robots.ts, app/genre/[slug]/page.tsx, app/blog/[slug]/page.tsx, memory/MEMORY.md |
| 2026-03-25 | feat(SEO): blog AI citation + internal game links — GOTY/Metacritic stats added, /games/[appid] links in all 5 posts | content/blog/*.tsx x5 |
| 2026-03-26 | fix(SEO): game meta description + tags, VideoGame schema image, blog H1 keyword, /genre+/blog BreadcrumbList schema, sitemap updatedAt, blog posts updatedAt | app/games/[appid]/page.tsx, app/blog/page.tsx, app/genre/page.tsx, app/sitemap.ts, content/blog/*.tsx x5 |
| 2026-03-26 | feat(SEO): per-post OG image for blog — opengraph-image.tsx (title+desc), generateMetadata images removed (file-based takes over) | app/blog/[slug]/opengraph-image.tsx, app/blog/[slug]/page.tsx |
| 2026-03-26 | feat(SEO): blog citation structure — blockquote+table CSS added; stat blocks + comparison tables in all 5 posts | app/blog/[slug]/page.module.css, content/blog/*.tsx x5 |
| 2026-03-26 | fix(ui): genre card equal height (li flex + card width:100% + gameName 2-line clamp); game FAQ items gap:12px | app/genre/[slug]/page.module.css, app/games/[appid]/page.module.css |
| 2026-03-26 | feat(ui): game page hero redesign — full-bleed blurred library_hero.jpg bg + library_600x900.jpg portrait cover + info panel; similar games cards with header.jpg thumbnails | app/games/[appid]/page.tsx, app/games/[appid]/page.module.css |
| 2026-03-26 | feat: /about page — service intro, contact, Footer link, sitemap entry | app/about/page.tsx, app/components/Footer.tsx, app/sitemap.ts |
| 2026-03-26 | refactor(footer): remove nav links (홈/장르/블로그) — header is fixed, redundant | app/components/Footer.tsx |
| 2026-03-26 | feat(ui): replace circular G/P badge → GuildelineMark SVG (hexagon+chevron) in login modal, Steam link popup, reset-password page | app/components/GuildelineMark.tsx (new), Header.tsx, Header.module.css, reset-password/page.tsx, reset-password/page.module.css |
| 2026-03-26 | feat(ui): backdrop-filter blur(6px) on modal overlay | app/components/Header.module.css |
| 2026-03-26 | fix(result): save button visible (remove max-height clip) + compact cards (thumbnail 30%, tighter padding/margins, reason 3-line clamp) | app/result/page.module.css |
| 2026-03-26 | fix(result): save button stays anon after modal login — replace one-shot getSession() with onAuthStateChange subscription; loadSession() shared helper | app/result/page.tsx |
| 2026-03-26 | perf(GuildelineMark): hoist constant SVG path calcs to module level (guideline check) | app/components/GuildelineMark.tsx |
| 2026-03-26 | feat(ui): favicon/mark refinement — hex strokeWidth↑, rgba lime fill, chevron2 opacity 0.38→0.48, apple-icon solid bg; applied to 7 files | app/icon.tsx, app/apple-icon.tsx, GuildelineMark.tsx, opengraph-image.tsx, blog/[slug]/opengraph-image.tsx, image-guildeline/×2 |
| 2026-03-26 | feat(ui): chevron strokeLinecap butt + strokeLinejoin miter — sharp angular ends; 7 files | same 7 files |
| 2026-03-26 | fix(ui): revert chevron polygon→polyline (solid arrowhead broke chevron shape); keep cg closer + strokeWidth thinner; 7 files | GuildelineMark.tsx, icon.tsx, apple-icon.tsx, opengraph-image.tsx, blog/[slug]/opengraph-image.tsx, image-guildeline/×2 |
| 2026-03-26 | feat(ui): saved games — 2-col grid, header.jpg thumbnail on left, savedCardContent wrapper, compact text (name 2-line clamp, reason 2-line clamp), mobile 1-col | app/page.tsx, app/page.module.css |
| 2026-03-26 | feat(ui): guildeline-logo.png — favicon+apple-icon use PNG via ImageResponse; NavLogo = PNG mark + GUILDELINE text; light theme filter: brightness(0.45) → #5a6c17; PNG white bg+interior → transparent (sharp pixel removal) | icon.tsx, apple-icon.tsx, NavLogo.tsx, NavLogo.module.css, public/guildeline-logo.png |
| 2026-03-26 | fix(ui): favicon transparent — GuildelineMark SVG → PNG; icon/apple-icon: base64-embedded PNG in ImageResponse (no URL fetch, runtime='edge') | GuildelineMark.tsx, icon.tsx, apple-icon.tsx |
| 2026-03-26 | fix(ui): logo PNG trimmed → zero padding (671x587); OG images + GuildelineMark updated — SVG replaced with PNG; GuildelineMark now shows mark + GUILDELINE wordmark | public/guildeline-logo.png, icon.tsx, apple-icon.tsx, opengraph-image.tsx, blog/[slug]/opengraph-image.tsx, GuildelineMark.tsx, GuildelineMark.module.css |
| 2026-03-26 | fix(a11y+ui): guideline check — NavLogo height 22→19 + height:auto (aspect ratio); GuildelineMark remove invalid aria-label on div | NavLogo.tsx, NavLogo.module.css, GuildelineMark.tsx |
| 2026-03-26 | fix(ui): savedStrip — add padding-inline-end:1.5rem so rightmost card isn't clipped at container edge | app/page.module.css |
| 2026-03-26 | feat(ui): saved games redesign — portrait strip (library_600x900.jpg), hover-expand right animation (120px→320px, 0.32s cubic), bottom gradient overlay fades out, detail panel reveals; prefers-reduced-motion safe | app/page.tsx, app/page.module.css |
| 2026-03-26 | fix(ui): regular hexagon everywhere — icon.tsx/GuildelineMark/NavLogo all use inline SVG with same geometry ratios (r=halfSize×0.8125); modal logo above close button (modalLogoArea→modalTitleRow split, closeBtn inside title row at right) | app/icon.tsx, GuildelineMark.tsx, NavLogo.tsx, NavLogo.module.css, Header.tsx, Header.module.css |
| 2026-03-26 | fix(ui): saved card — reason flex:1 removed + clamp 4→3 (prevents mid-line clip when name is 2 lines); meta margin-top:auto (pins to bottom); savedStrip padding-inline-end 1.5rem→200px (rightmost card expand no longer clips) | app/page.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
AdSense activation steps (post FT-series) → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
