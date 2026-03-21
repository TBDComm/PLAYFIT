# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 163/200 lines — OK**
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
| C10 | Schema Markup — JsonLd.tsx component; @graph on all pages: WebApplication+Organization+WebSite (main), SoftwareApplication+BreadcrumbList (game), ItemList+BreadcrumbList (genre), BlogPosting+BreadcrumbList (blog) | ✅ 2026-03-20 |
| C11 | On-Page SEO — meta title templates (main/blog post fixed), H1 logo GUILDELINE fix, blog internal links to /genre + / | ✅ 2026-03-20 |
| C12 | AI SEO — FAQ block on game pages, definition block on genre pages, dateModified in all schemas, updatedAt on blog posts | ✅ 2026-03-20 |
| C13 | Core Web Vitals — `<Image unoptimized>` (CF Pages constraint), `requestIdleCallback` for analytics (INP), ad minHeight wrapper (CLS) | ✅ 2026-03-20 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳ (pending AdSense approval — add to CF Pages when Publisher ID received)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅

---

## ── ACTIVE STEP: FT6 — Home Preview Section Redesign ────

**Prerequisites:** FT4 complete ✅ — no blockers.
**FT done:** FT5✅ FT3✅ FT1✅ FT2✅ FT4✅ · FT7 follows · D-series = separate community phase — not FT-series
**Files:** `app/page.tsx`, `app/page.module.css`
**Goal:** Replace FT1's 2 clipped preview cards with (A) full-width thumbnail strip + (B) saved games shell.
**Design:** Tag chips on hover — taste matcher signal, not a browse gallery.

**Migration:** Remove `previewCardList` JSX block (Elden Ring + Hades; classes `previewCard`/`previewThumb`/`previewCardBody`). Keep `previewLabel`, `previewTitle`, `previewCta`.

**JSX** — `.previewStrip` OUTSIDE `.inner` for full-width scroll:
```tsx
<section className={styles.previewSection}>
  <div className={styles.inner}>…previewLabel, previewTitle…</div>
  <div className={styles.previewStrip}>
    {PREVIEW_TILES.map(tile => (
      <Link href={`/games/${tile.appid}`} key={tile.appid} className={styles.previewTile}>
        <Image unoptimized src={`https://cdn.akamai.steamstatic.com/steam/apps/${tile.appid}/header.jpg`}
          width={460} height={215} alt={tile.name} className={styles.previewTileImg} />
        <div className={styles.previewTileOverlay}>
          <span className={styles.previewTileName}>{tile.name}</span>
          <div className={styles.previewTileChips}>{tile.tags.map(t => <span key={t} className={styles.previewTileChip}>{t}</span>)}</div>
        </div>
      </Link>
    ))}
  </div>
  <div className={styles.inner}>…previewCta…</div>
  <div className={styles.inner} style={{ marginTop: '3rem' }}>…Sub-section B…</div>
</section>
```

**PREVIEW_TILES** (const outside component — appid · name · tags[]):
```
1245620 Elden Ring      · Souls-like, Open World, Action RPG, Difficult
1145360 Hades           · Roguelike, Action, Fast-Paced, Story Rich
413150  Stardew Valley  · Farming Sim, Relaxing, Pixel Graphics, Indie
367520  Hollow Knight   · Metroidvania, Souls-like, Atmospheric, Indie
292030  The Witcher 3   · Open World, RPG, Story Rich, Dark Fantasy
105600  Terraria        · Sandbox, Crafting, Building, Exploration
504230  Celeste         · Platformer, Difficult, Pixel Art, Story Rich
588650  Dead Cells      · Roguelike, Action, Metroidvania, Fast-Paced
```

**CSS:** Tile `width:220px`, `aspect-ratio:460/215`, `overflow:hidden`. Image hover: `filter:blur(4px) brightness(0.4)` + `scale(1.04)`, 300ms. Overlay: `position:absolute; inset:0`, `opacity:0→1`, 300ms, pure CSS `:hover`. Chips: accent-dim bg/border/text, `flex-wrap:wrap; gap:4px; justify-content:center`. Scrollbar: `scrollbar-width:none` + `::-webkit-scrollbar{display:none}`. `prefers-reduced-motion` → `transition:none`.

**Sub-B shell:** Label "내 저장 목록" (`.previewLabel`), title "내가 저장한 게임" (`.previewTitle`). 3 placeholder cards (~120px height): "추천받은 게임을 저장하면 여기에 표시돼요". No auth check — FT7 replaces entirely.

**Scope:** No auth logic, no Supabase calls — FT7 only.
**After completing:** Clear lock → mark FT6 done in FT-series list → update Active Step to FT7 spec (read SPEC.md §FT7) → add Minor Changes Log entry → AdSense activation checklist → `HANDOVER-archive.md`.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-2026-03-21 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-21 | feat(FT2): genre index — count per genre, sort by count desc, top 12 featured 3-col grid, stat line | app/genre/page.tsx, app/genre/page.module.css |
| 2026-03-21 | feat(FT4): 2 new blog posts — action guide 10선, indie hidden gems 10선; registry updated | content/blog/steam-genre-guide-action.tsx, content/blog/indie-games-hidden-gems.tsx, lib/blog.ts |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
AdSense activation steps (post FT-series) → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
