# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 165/200 lines — OK**
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

## ── ACTIVE STEP: FT7 — Save Recommendations Feature ────

**FT done:** FT1✅ FT2✅ FT3✅ FT4✅ FT5✅ FT6✅ · D-series = separate community phase
**Context:** Logged-in users save game recommendations. "Save = taste alignment signal." Minimal UI.

**Step 7-1: Supabase table** — user runs this SQL in dashboard:
```sql
create table saved_games (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  appid text not null, name text not null, reason text,
  price_krw integer, metacritic_score integer,
  saved_at timestamptz default now() not null,
  unique(user_id, appid)
);
alter table saved_games enable row level security;
create policy "users can manage their own saved games"
  on saved_games for all using (auth.uid() = user_id);
```

**Step 7-2: API routes** — auth pattern: client sends `Authorization: Bearer <token>`, server uses `serviceRoleKey` + `supabase.auth.getUser(token)`. All routes: `export const runtime = 'edge'`
- `GET /api/saved-games` → `{ saved: SavedGame[] }` · 401 if unauthed
- `POST /api/saved-games` body: `{ appid, name, reason?, price_krw?, metacritic_score? }` → upsert → `{ ok: true }`
- `DELETE /api/saved-games/[appid]` — Next.js 15: `const { appid } = await context.params` (params is a Promise)

**TypeScript type** (add to `types/index.ts`): `SavedGame { id, user_id, appid, name, reason, price_krw, metacritic_score, saved_at }`

**Step 7-3: Result page** (`app/result/page.tsx`) — currently has NO supabase client.
- Add module-level `const supabase = createBrowserClient(...)`
- States: `authState: 'loading'|'authed'|'anon'`, `savedAppIds: Set<string>`
- useEffect: getSession → if authed, fetch saved-games → build Set of appids
- Each card: save button (only if `authState !== 'anon'`). No icon library — text+Unicode only:
  - Saved: `"★ 저장됨"` · accent color · `background: var(--accent-dim)` · `border: 1px solid`
  - Unsaved: `"☆ 저장"` · muted · `background: var(--bg-surface)` · `border: 1px solid`
  - Optimistic toggle → POST or DELETE; `padding: 4px 10px; font-size: 0.8125rem; border-radius: var(--radius)`
  - NEVER transparent background (feedback_no_transparent_buttons rule)

**Step 7-4: Home page** (`app/page.tsx`) — activate FT6 placeholder with real data.
- Move supabase client to module level (currently created inside useEffect — refactor out)
- Add `savedGames: SavedGame[]` state; second useEffect depends on `authState`
- authState display logic:
  - `loading` → 3 placeholder cards (skeleton, no text)
  - `anon` → 3 placeholders + "로그인하면 저장한 게임이 여기에 표시돼요" + "로그인하기 →" button
    - onClick: `window.dispatchEvent(new CustomEvent('guildeline:open-login'))`
    - Header.tsx: add useEffect listener for this event → `setShowLoginModal(true)`
  - authed, 0 saved → 3 placeholders + "추천받은 게임을 저장하면 여기에 표시돼요" + anchor "지금 추천받기 ↑"
  - authed, >0 saved → actual cards (newest first): name + reason + price/score + "저장 취소" button

**Files:** `app/api/saved-games/route.ts`, `app/api/saved-games/[appid]/route.ts`, `app/result/page.tsx`, `app/result/page.module.css`, `app/page.tsx`, `app/page.module.css`, `app/components/Header.tsx`, `types/index.ts`

**After completing:** Clear lock → mark FT7 done → update Active Step to next → add Minor Changes Log.

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_Pre-2026-03-21 entries → HANDOVER-archive.md_

| Date | Change | Files |
|------|--------|-------|
| 2026-03-21 | feat(FT2): genre index — count per genre, sort by count desc, top 12 featured 3-col grid, stat line | app/genre/page.tsx, app/genre/page.module.css |
| 2026-03-21 | feat(FT4): 2 new blog posts — action guide 10선, indie hidden gems 10선; registry updated | content/blog/steam-genre-guide-action.tsx, content/blog/indie-games-hidden-gems.tsx, lib/blog.ts |
| 2026-03-21 | feat(FT6): preview section redesign — 8-tile horizontal scroll strip + hover tag chips + saved games placeholder shell; removed dead previewCard CSS | app/page.tsx, app/page.module.css |

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
AdSense activation steps (post FT-series) → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
