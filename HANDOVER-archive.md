# HANDOVER Archive

## Minor Changes Log — 2026-03-28

| Date | Change | Files |
|------|--------|-------|
| 2026-03-28 | Remove all "AI" wording from meta/pages/blog | `layout.tsx`, `page.tsx`, `about`, `opengraph-image`, `terms`, `privacy`, 2 blog posts |
| 2026-03-28 | bug(feedback): anon key → service role for `user_tag_weights` upsert | `api/feedback/route.ts` |
| 2026-03-28 | bug(settings): server page + `SettingsWrapper`(dynamic ssr:false) + `SettingsClient`; `runtime=edge` ignored in `'use client'` files | `settings/` |
| 2026-03-28 | bug(feedback): add Authorization header; `getUserId()` bearer-first auth | `api/feedback/route.ts`, `result/page.tsx` |
| 2026-03-28 | bug(tag-weights GET): merge `user_id`+`steam_id` rows; fix empty state msg; parallelize profile+user_id queries | `api/tag-weights/route.ts`, `SettingsClient.tsx` |
| 2026-03-28 | bug(auth): `getSession`→`onAuthStateChange(INITIAL_SESSION)` in home+settings; double-call guard; `SettingsWrapper` loading skeleton | `page.tsx`, `SettingsClient.tsx`, `SettingsWrapper.tsx` |
| 2026-03-28 | bug(recommend): `getUserTagWeights` anon key singleton → RLS blocked → `serviceSupabase` | `lib/supabase.ts` |
| 2026-03-28 | bug(feedback): feedback INSERT anon key → RLS blocked → `serviceSupabase` | `app/api/feedback/route.ts` |
| 2026-03-28 | bug(auth): `TOKEN_REFRESHED` not handled in home+settings | `app/page.tsx`, `app/settings/SettingsClient.tsx` |
| 2026-03-28 | feat(ux): PageLoading on all pages while auth loading | `app/page.tsx`, `app/result/page.tsx`, `app/settings/SettingsClient.tsx` |
| 2026-03-28 | fix(home): early-return loading broke IntersectionObserver refs → fixed overlay | `app/page.tsx`, `app/page.module.css` |
| 2026-03-28 | feat(home): library picker modal — Steam-linked users pick up to 5 games | `lib/steam.ts`, `api/steam/library/route.ts`, `LibraryPickerModal.tsx/.css` |
| 2026-03-28 | fix(library-picker): loading message, body scroll, "0개" button, max-5 label; thumbnails lazy; 7 guideline violations | `page.tsx`, `LibraryPickerModal.tsx/.css` |
| 2026-03-28 | fix(guidelines): Gemini review — CSS variables, handleUnsave parallel, overscroll, aria-labels | `globals.css`, `page.module.css`, `SavedGames.tsx` |
| 2026-03-28 | refactor(supabase): createBrowserClient @supabase/auth-helpers-nextjs → @supabase/ssr | `FeedbackButtons.tsx`, `RecommendationForm.tsx`, `Header.tsx`, `SavedGames.tsx`, `SettingsClient.tsx`, `reset-password/page.tsx` |
| 2026-03-28 | fix(styles): overscroll-behavior-x savedStrip; hardcoded hex → CSS vars in LibraryPickerModal, result page | `page.module.css`, `LibraryPickerModal.module.css`, `result/[id]/page.module.css`, `globals.css` |
| 2026-03-28 | fix(guidelines): 6 violations — supabase module scope, serviceSupabase, aria-label+role=dialog, box-shadow transition | `FeedbackButtons.tsx`, `api/tag-weights/route.ts`, `LibraryPickerModal.tsx`, `SettingsClient.tsx`, `result/[id]/page.module.css` |
| 2026-03-28 | fix(guidelines): sampleSection/previewSection invisible, stale ref, ScrollToTopButton reduced-motion, unused import | `page.module.css`, `result/[id]/page.module.css`, `RecommendationForm.tsx`, `ScrollToTopButton.tsx`, `SavedGames.tsx` |
| 2026-03-28 | feat(result): Gemini refactor — sessionStorage→DB-persisted results, `/result/[id]` route, `recommendation_sets` table, library picker integration | `RecommendationForm.tsx`, `page.module.css`, `result/[id]/` (new), `api/generate-recommendation/` (new); deleted old result+recommend+steam routes |
| 2026-03-28 | fix(result): params→Promise<{id}>, cookies()+json() parallel, service-role INSERT | `result/[id]/page.tsx`, `api/generate-recommendation/route.ts` |
| 2026-03-28 | refactor(code-quality): globals.css variables, serviceSupabase centralized, callApi helper, Array.isArray guards | `globals.css`, `Header.module.css`, `reset-password/page.module.css`, `settings/page.module.css`, `games/[appid]/page.module.css`, `lib/supabase.ts`, `api/feedback/route.ts`, `package.json`, `RecommendationForm.tsx`, `result/[id]/page.tsx` |
| 2026-03-28 | ux(home): 5 improvements — auth-loading submit disabled, steam subtitle, URL validation, manual notice, sample card order | `RecommendationForm.tsx`, `page.tsx` |
| 2026-03-28 | fix(saved-games): wrap in savedSection (padding/bg/border-top); skeleton pulse animation; savedGamesSkeleton updated | `SavedGames.tsx`, `page.module.css` |
| 2026-03-28 | fix(design): 7-point audit — CSS variables (accent-faint/trace/overlay-backdrop), border-radius var(--radius), LoadingOverlay rgba→vars, LibraryPickerModal backdrop var | `globals.css`, `LoadingOverlay.module.css`, `LibraryPickerModal.module.css`, `page.module.css`, `SavedGames.tsx`, `Header.module.css` |

---

## Minor Changes Log — 2026-03-21 to 2026-03-27

| Date | Change | Files |
|------|--------|-------|
| 2026-03-21 | feat(FT2): genre index — count per genre, sort by count desc, top 12 featured 3-col grid, stat line | app/genre/page.tsx, app/genre/page.module.css |
| 2026-03-21 | feat(FT4): 2 new blog posts — action guide 10선, indie hidden gems 10선; registry updated | content/blog/steam-genre-guide-action.tsx, content/blog/indie-games-hidden-gems.tsx, lib/blog.ts |
| 2026-03-21 | feat(FT6): preview section redesign — 8-tile horizontal scroll strip + hover tag chips + saved games placeholder shell | app/page.tsx, app/page.module.css |
| 2026-03-23 | feat(FT7): save recommendations — API routes, result ★/☆ toggle, home saved section | 8 files |
| 2026-03-23 | feat: LoadingOverlay redesign — glitch wordmark + radar sweep + terminal log; PageLoading for transitions | 9 files |
| 2026-03-23 | feat: preview section — portrait grid, 5-col grid, hover overlay; rotation pool 22 games, 15 shown, swap every 2.8s | app/page.tsx, app/page.module.css |
| 2026-03-25 | refactor: marketing-skills — 9 dirs deleted, 12 merged into SEO-SKILLS.md | marketing-skills/ |
| 2026-03-25 | fix(SEO): sitemap, robots, schemas, meta, OG images — full audit P1–P3 | multiple files |
| 2026-03-25 | feat(SEO): OG image + favicon via ImageResponse (opengraph-image.tsx, icon.tsx, apple-icon.tsx) | 3 new files |
| 2026-03-25 | feat(SEO): blog AI citation + internal game links, stat blocks, comparison tables | content/blog/*.tsx x5 |
| 2026-03-26 | feat(ui): game page hero redesign — full-bleed blurred hero bg + portrait cover + info panel | app/games/[appid]/page.tsx, .module.css |
| 2026-03-26 | feat(ui): saved games → portrait strip, hover-expand panel (later replaced by portal overlay) | app/page.tsx, app/page.module.css |
| 2026-03-26 | feat(ui): GuildelineMark SVG component; login modal, Steam link popup, reset-password | GuildelineMark.tsx (new), Header.tsx, Header.module.css |
| 2026-03-26 | feat(ui): guildeline-logo.png — favicon via PNG; NavLogo = PNG mark + wordmark | icon.tsx, apple-icon.tsx, NavLogo.tsx, public/guildeline-logo.png |
| 2026-03-26 | fix(ui): various — genre card equal height, FAQ gap, footer nav removed, hexagon geometry, modal layout | multiple files |
| 2026-03-26 | fix(SEO): game meta desc+tags, VideoGame schema, blog H1, BreadcrumbList, sitemap updatedAt, per-post OG | multiple files |
| 2026-03-26 | feat: /about page | app/about/page.tsx, Footer.tsx, sitemap.ts |
| 2026-03-27 | fix(ui): icon.tsx SVG→PNG (guildeline-logo base64); NavLogo SVG mark→img tag; login modal logo removed + title 'guildeline에 로그인하기'; favicon transparent bg wrapper div in ImageResponse | app/icon.tsx, NavLogo.tsx, Header.tsx |
| 2026-03-27 | fix(ui): NavLogo wordmark — wrap text in span so GUILD+ELINE are one flex item (gap was splitting them) | app/components/NavLogo.tsx |
| 2026-03-27 | fix(favicon): static PNG via public/ — app/icon.png+apple-icon.png deleted (CF Pages treats app/ PNGs as dynamic routes); layout.tsx metadata icons → /guildeline-logo.png | app/layout.tsx, app/icon.png (deleted), app/apple-icon.png (deleted) |
| 2026-03-27 | feat(ui): login modal title — icon (guildeline-logo.png 22px) + accent color on 'guildeline'; modalTitleRow column layout (title above X btn) | Header.tsx, Header.module.css |
| 2026-03-27 | fix(ui): saved strip last card clip — last-child flex-direction:row-reverse + translateX(-200px) on hover; image stays right, panel expands left; z-index:1 on hover; reduced-motion safe | app/page.module.css |
| 2026-03-27 | perf: remove base64 PNG from OG image files — LOGO_B64 const deleted, img src → NEXT_PUBLIC_BASE_URL/guildeline-logo.png; 38KB→4.7KB (token cost fix) | app/opengraph-image.tsx, app/blog/[slug]/opengraph-image.tsx |
| 2026-03-27 | chore: token waste audit — SPEC.md 65KB→stub (all content → SPEC_archive.md); project_seo_pending.md condensed to regression checklist; project_design_identity.md pruned (TagScatter data in code) | SPEC.md, SPEC_archive.md, memory/×2, MEMORY.md |
| 2026-03-27 | feat(ui): saved card dimmed neighbors — non-hovered cards scale(0.95)+opacity:0.38 when panel open; savedCardActive keeps border+overlay state while mouse is on panel (not card) | app/page.tsx, app/page.module.css |
| 2026-03-27 | feat(ui): saved card hover panel — portal overlay (Option C); card fixed 120px, panel position:fixed via createPortal; enter/leave timers (120ms grace + 100ms fade-out); keyboard unsave btn (focus-visible only); left-side flip when near right viewport edge; prefers-reduced-motion safe | app/page.tsx, app/page.module.css |

## AdSense Activation Checklist (run after FT-series complete + approval)

Apply for AdSense AFTER FT-series is fully complete. When approval email arrives:

1. **CF Pages env var** — add `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX`
2. **`public/ads.txt`** — uncomment line, replace `pub-XXXXXXXXXXXXXXXX` with real Publisher ID
3. **Ad slot IDs** — replace all `slot="0000000000"` with real slot IDs from AdSense dashboard:
   - `app/games/[appid]/page.tsx` — "game detail" slot
   - `app/genre/[slug]/page.tsx` — "in-list" slot
   - `app/blog/[slug]/page.tsx` — "in-article" slot
   - `app/blog/page.tsx` — "display" slot
   - `app/result/page.tsx` — "display" slot
4. Deploy → verify ads appear on each page type

## Minor Changes — 2026-03-20 (FT1–5, domain rename, C12–C13)
| Change | Files |
|--------|-------|
| Fix: `runtime = 'edge'` required on all dynamic `[param]` routes | `games/[appid]/page.tsx`, `genre/[slug]/page.tsx`, `users/[userId]/page.tsx` |
| Fix: blog/[slug] — remove generateStaticParams (edge runtime incompatible) | `app/blog/[slug]/page.tsx` |
| Rename: PlayFit → Guildeline (internal identifiers unchanged) | all tsx/ts/md |
| feat: LoadingOverlay (G logo pulse + bouncing dots); Toast on Steam link success | `LoadingOverlay.tsx/.css`, `page.tsx`, `Header.tsx/.css` |
| ui: "Steam 연동됨" muted text for email/Google users already linked | `Header.tsx`, `Header.module.css` |
| feat(C12): FAQ block (game pages), definition block (genre), dateModified + updatedAt | `games/[appid]/`, `genre/[slug]/`, `blog/[slug]/`, `lib/blog.ts` |
| feat(C13): `<Image unoptimized>` + failedImages; analytics → requestIdleCallback | `result/page.tsx`, `lib/analytics.ts` |
| Domain: guildeline.com live — CF Pages, BASE_URL, Google, Supabase, GA4 updated | external |
| feat(FT5): Intl.DateTimeFormat blog/page.tsx; CSS comments PLAYFIT→GUILDELINE | `blog/page.tsx`, `globals.css`, `page.module.css`, `result/page.module.css` |
| feat(FT3): Footer nav row (홈 · 장르별 탐색 · 블로그) | `Footer.tsx` |
| feat(FT1): Hero — TagScatter bg, h2, stat line, CTA, preview cards, How it works | `page.tsx`, `page.module.css`, `TagScatter.tsx/.css` |
| fix: genre index — fixed 4/3/2 col grid (auto-fill caused last-row stretch) | `genre/page.module.css` |

## Minor Changes — 2026-03-18~20 (C-series UI + fixes)
| Change | Files |
|--------|-------|
| UI: legal page logo, result card thumbnails + Metacritic score tiers | `privacy/page.tsx`, `terms/page.tsx`, `result/page.tsx`, `result/page.module.css`, `layout.tsx` |
| Fix: search debounce 300ms → 150ms; race condition via searchGenRef | `page.tsx` |
| C3: GA4 gtag.js + 5 events; NEXT_PUBLIC_GA_MEASUREMENT_ID added to CF Pages | `layout.tsx`, `lib/analytics.ts`, `page.tsx`, `result/page.tsx`, `Header.tsx` |
| UI: result page — thumbnail height:auto no-crop, card max-height via cqw, padding 14%, logo outside .inner | `result/page.tsx`, `result/page.module.css` |
| UI: all button transparent backgrounds → var(--bg-elevated); footerLink full button; closeBtn border added | `Header.module.css`, `page.module.css` |
| C4: sticky nav bar → removed; auth buttons fixed top-right; NavLogo fixed top-left; Breadcrumb; /genre index; /users/[userId] reserved | multiple |
| C5: `/games/[appid]` ISR 86400s, similar games TOP 10 via score_candidates RPC, SoftwareApplication JSON-LD | `app/games/[appid]/page.tsx`, `app/games/[appid]/page.module.css`, `app/sitemap.ts` |
| C6: `/genre/[slug]` ISR 86400s, top 20 by tag sum, ItemList JSON-LD, community placeholder | `app/genre/[slug]/page.tsx`, `app/genre/[slug]/page.module.css` |
| C7: Blog TSX content approach (edge-safe); 3 posts; BlogPosting JSON-LD; sitemap updated | `lib/blog.ts`, `content/blog/*.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx` |
| UI: home page — genre + blog links fixed top-left; footer — privacy + terms only | `app/page.tsx`, `app/page.module.css`, `app/components/Footer.tsx` |
| UI: genre page — aspect-ratio 5/2 + font-size clamp(cqi) for auto text scaling | `app/genre/page.module.css` |

## Minor Changes — 2026-03-18 (B-series fixes + C1/C2)
| Change | Files |
|--------|-------|
| B8–B10: E2E manual test checklists — email/Steam/non-auth paths | `TEST_B8_B10.md` |
| Fix: missing `…` on password field placeholders (2 fields) | `Header.tsx`, `reset-password/page.tsx` |
| Fix: Google login FedCM error — remove `prompt()`, replace with `renderButton()` | `Header.tsx`, `Header.module.css` |
| Fix: dead code — merge duplicate steamBtn CSS, add showOAuth to useEffect deps | `Header.tsx`, `Header.module.css` |
| Fix: detect duplicate email signup — identities.length===0 check | `Header.tsx` |
| Fix: link-steam migration silent fail — fetch→merge(avg)→upsert→delete | `link-steam/route.ts` |
| Perf: link-steam step 3+5 DB queries now run in parallel | `link-steam/route.ts` |
| Dead code: remove GAME_NOT_FOUND (never returned by any API route) | `types/index.ts`, `page.tsx` |
| Fix: Steam OpenID — `!includes('is_valid:true')` (auth bypass on outage) | `steam/callback/route.ts` |
| Fix: handleLinkSteam — try-catch-finally so linkLoading clears on error | `Header.tsx` |
| Fix: debounce delay 0ms → 300ms (race condition on every keystroke) | `page.tsx` |
| Fix: --bg-base undefined variable → --bg in reset-password | `reset-password/page.module.css` |
| Responsive: mobile media queries + 100dvh + iOS zoom fix across all pages | `globals.css`, `Header.module.css`, `page.module.css`, `result/page.module.css`, `reset-password/page.module.css` |
| C-series spec defined — C1–C13 (AdSense monetization); marketing-skills/ copied | `SPEC.md`, `marketing-skills/` |
| marketing-skills/ pruned — 33 → 22 skills | `marketing-skills/REMOVED.md` |
| C1: robots.ts, sitemap.ts, layout.tsx OG/Twitter meta tags | `app/robots.ts`, `app/sitemap.ts`, `app/layout.tsx` |
| C2: /privacy + /terms + Footer component | `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/components/Footer.tsx`, `app/legal.module.css`, `app/layout.tsx` |
| Fix: ESLint react/no-unescaped-entities in terms/page.tsx — build was failing | `app/terms/page.tsx` |
| UI: remove header banner — buttons moved to fixed top-right floating | `Header.tsx`, `Header.module.css` |

## B3 — 2026-03-16 — Header + Google OAuth modal + auth callback
- Files: `app/components/Header.tsx`, `app/components/Header.module.css`, `app/api/auth/callback/route.ts`, `app/layout.tsx`
- Decisions: `createBrowserClient` used (not `createClientComponentClient` — not exported in v0.15); `@supabase/ssr` v0.9 uses `getAll`/`setAll`; `NextRequest` needed in callback to access `cookies.getAll()`
- Watch out: Steam button redirects to `/api/auth/steam` (B4); email OTP added in B7 (was not post-MVP)
- Build: `tsc --noEmit` passed ✅

## B1 + B2 — 2026-03-16 — Supabase schema additions
- SQL only: `user_profiles` table created; `user_id UUID` added to `user_tag_weights` (+ unique constraint on user_id+tag) + `feedback`
- Decisions: `steam_id` kept — pre-login weights migrate on B4-link (`UPDATE ... WHERE user_id IS NULL`)
- Build: no code changes; SQL run in Supabase dashboard ✅

## B8–B10 — 2026-03-18 — E2E manual test checklists
- Files: `TEST_B8_B10.md`
- B8: email login → link Steam → recommend → feedback; B9: Steam login → auto recommend; B10: non-auth → weights by steam_id
- Build: `tsc --noEmit` passed ✅

## B7 — 2026-03-16~17 — Header + login modal + auth system
- Files: `Header.tsx`, `Header.module.css`, `page.tsx`, `page.module.css`, `reset-password/page.tsx`
- Auth: email+password login/signup; OTP signup-only; forgot password → /reset-password; Google GIS + signInWithIdToken; Steam OpenID popup
- Header: 3 auth states; Steam link popup auto-opens after non-Steam login; page.tsx hides URL input when Steam-authed
- Build: `tsc --noEmit` passed ✅

## B6 — 2026-03-16 — /api/feedback session-aware
- Files: `app/api/feedback/route.ts`
- Changes: `createServerClient` reads session; feedback insert includes `user_id`; weights upsert on `user_id,tag` (logged-in) or `steam_id,tag` (anon)
- Build: `tsc --noEmit` passed ✅

## B5 — 2026-03-16 — /api/recommend four auth cases
- Files: `app/api/recommend/route.ts`, `lib/supabase.ts`
- Changes: `createServerClient` reads session; weights by `user_id` (Cases 1–3, logged in) or `steam_id` (Case 4, anon); `getUserTagWeights` gains `by` param
- Build: `tsc --noEmit` passed ✅

## B4 + B4-link — Spec (completed 2026-03-16)
- Steam OpenID redirect → `https://steamcommunity.com/openid/login` with checkid_setup params
- Callback: POST `check_authentication` → extract steamid64 → find/create user_profiles + auth.users → `generateLink({ type: 'magiclink' })` → redirect to action_link → Supabase sets session via `/api/auth/callback`
- link-steam POST: session check → parseSteamUrl/resolveVanityUrl → 409 if different user has steam_id → UPDATE user_profiles + UPDATE user_tag_weights WHERE user_id IS NULL
- Key decision: `shouldCreateUser` not in generateLink type — removed; user already exists by that point

## Minor Changes — 2026-03-15
| Change | Files |
|--------|-------|
| ownedAppIds bug fix: full owned game list for exclusion | `lib/steam.ts`, `app/api/steam/route.ts`, `app/api/recommend/route.ts`, `app/page.tsx` |
| Fix CF Workers subrequest limit: scored pool 50→40, candidates cap 30→20 | `app/api/recommend/route.ts` |
| Debug logging added to catch blocks + supabase error fields | `app/api/recommend/route.ts`, `app/api/steam/route.ts`, `lib/supabase.ts` |
| Remove koreanOnly filter entirely — global targeting, language-agnostic | `app/page.tsx`, `app/api/recommend/route.ts`, `app/result/page.tsx`, `types/index.ts`, `lib/steam.ts` |
| Fix AI_PARSE_FAILURE: robust JSON extraction ({} match), reason 1 sentence | `lib/claude.ts` |
| Pre-A6: 2-button feedback (remove neutral), playtime sqrt+normalize scoring | `types/index.ts`, `app/result/page.tsx`, `app/api/feedback/route.ts`, `app/api/recommend/route.ts`, Supabase score_candidates RPC |
| A6: manual mode toggle + 5-row form + manual mode disclaimer notice | `app/page.tsx`, `app/page.module.css` |
| Fix 3 guideline violations: label→span, flex min-width, prefers-reduced-motion | `app/page.tsx`, `app/page.module.css` |
| A7: /api/search route + autocomplete UI + blur/submit validation | `app/api/search/route.ts`, `app/page.tsx`, `app/page.module.css` |
| Fix: req.nextUrl → new URL(req.url) for CF edge runtime compat | `app/api/search/route.ts` |
| A8: /api/recommend handles manualGames body shape (manual mode) | `app/api/recommend/route.ts` |
| Fix 4 guideline violations: themeColor, alert/aria-live, focus-first-error, dead CSS | `app/layout.tsx`, `app/page.tsx`, `app/result/page.module.css` |

## Minor Changes — 2026-03-14
| Change | Files |
|--------|-------|
| Anthropic SDK → fetch: fixed Edge runtime incompatibility | `lib/claude.ts` |
| Added Korean-only / free-only filter toggles | `app/page.tsx`, `app/page.module.css` |
| Contextual NO_GAMES_IN_BUDGET error messages | `app/page.tsx`, `app/api/steam/route.ts` |
| A5 fix: feedback insert error check; h1 hierarchy on result page; placeholder `…` | multiple |

## A5 — 2026-03-14 — Feedback tag weight update
- Files: `types/index.ts`, `app/api/recommend/route.ts`, `app/api/feedback/route.ts`, `app/result/page.tsx`
- `tag_snapshot: string[]` added to `RecommendationCard` + `FeedbackPayload`
- `/api/feedback`: insert + weight fetch in parallel; positive → +0.2 (cap 3.0, insert 1.2); negative → -0.3 (floor 0.1, insert 0.7); neutral → no change
- `result/page.tsx`: sends `tag_snapshot` in feedback payload

## A3+A4 — 2026-03-14 — DB-based candidate selection + tag-based Claude prompt
- Files: `types/index.ts`, `lib/supabase.ts`, `lib/steam.ts`, `lib/claude.ts`, `app/api/steam/route.ts`, `app/api/recommend/route.ts`, `app/page.tsx`
- `/api/steam` simplified: URL resolve + getOwnedGames only → `{ steamId, playHistory }`
- `/api/recommend` pipeline: isDbReady → getTagsForGames + getUserTagWeights (parallel) → tagProfile → scoreCandidates (RPC) → getGameDetails top50 → filter → Claude (top_tags) → cards
- Claude prompt: tag-based, top_tags instead of genres; budget/freeOnly/koreanOnly moved to recommend call
- Requires `score_candidates` RPC + GIN index in Supabase

## A2 — 2026-03-14 — DB build script
- Files: `scripts/build-games-db.ts` (new)
- Run: `npx tsx --env-file=.env.local scripts/build-games-db.ts`
- SteamSpy paginated API → individual appdetails per game; 300ms delay; resumable (skips if updated within 30 days)
- Upserts to `games_cache`: appid, name, genres TEXT[], tags JSONB; logs every 1000 games; on failure: log + skip

## A1 — 2026-03-13 — Supabase schema
- Files: Supabase SQL migration (manual)
- Tables: `games_cache` (appid, name, genres TEXT[], tags JSONB), `user_tag_weights` (steam_id, tag, weight), `feedback` (+ tag_snapshot column)
- All tables created in Supabase dashboard; no local migration file

## Step 10 — 2026-03-13 — Cloudflare Pages deploy setup
- Files: `package.json`, `next.config.js`, `app/api/steam/route.ts`, `wrangler.toml`
- Installed: `@cloudflare/next-on-pages`, `wrangler`
- Added `export const runtime = 'edge'` to `/api/steam` (all subsequent API routes also need this)
- `pages:build` script: `npx @cloudflare/next-on-pages` → `.vercel/output/static`
- CF Pages: Build command `npm run pages:build`, Output `.vercel/output/static`, Compatibility flag `nodejs_compat`

## Step 8 — 2026-03-13 — Supabase client + feedback route
- Files: `lib/supabase.ts` (new), `app/api/feedback/route.ts` (new)
- createClient with NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
- POST /api/feedback → insert into feedback table → 200 or 500; all fields validated; runtime = 'edge'

## Step 7 — 2026-03-13 — Result page UI
- Files: `app/result/page.tsx` (new), `app/result/page.module.css` (new)
- sessionStorage → RecommendationCard[], missing/invalid → router.replace('/')
- Cards: name, reason, meta row (price/score/korean), store link, feedback buttons
- Price: Intl.NumberFormat('ko-KR'); feedback: fire-and-forget POST /api/feedback, optimistic UI
- No emojis per user preference

## Step 6 — 2026-03-13 — Main page UI
- Files: `app/page.tsx` (replaced placeholder), `app/page.module.css` (new)
- Design: PLAY(lime) + FIT(white) logo, dot grid background with vignette
- Flow: POST /api/steam → POST /api/recommend → sessionStorage → router.push('/result')
- All 6 error codes mapped to Korean UI strings; aria-live polite on error

## Step 5 — 2026-03-13 — Claude API integration
- Files: `lib/claude.ts` (new), `app/api/recommend/route.ts` (new)
- `getRecommendations(playHistory, candidates)`: claude-haiku-4-5, max_tokens 500
- try-catch + JSON.parse defense → AI_PARSE_FAILURE on failure
- Route merges Claude output with GameCandidate details → RecommendationCard[] with store_url

## Step 4 — 2026-03-13 — Candidate games
- Files: `lib/steam.ts`, `app/api/steam/route.ts`
- `getFeaturedAppIds()`: featuredcategories → deduped appids (new_releases + top_sellers)
- `getGameDetails(appid)`: appdetails → GameCandidate or null (skips if no price + not free)
- `getCandidateGames()`: sequential fetch 200ms delay, up to 30 → NO_GAMES_IN_BUDGET if 0
- featuredcategories fetch starts in parallel with vanity resolution

## Step 3 — 2026-03-13 — Owned games + play history
- Files: `lib/steam.ts`, `app/api/steam/route.ts`
- `getOwnedGames(steamId)`: GetOwnedGames → PRIVATE_PROFILE / INSUFFICIENT_HISTORY / PlayHistory[]
- Top 15 sorted by playtime_forever desc, converted to hours (÷60, rounded 1dp)

## Step 2 — 2026-03-13 — Steam URL parsing + SteamID resolution
- Files: `lib/steam.ts`, `app/api/steam/route.ts`
- `parseSteamUrl()`: `/profiles/{digits}` → SteamID64, `/id/{word}` → vanity, else INVALID_URL
- `resolveVanityUrl()`: ResolveVanityURL API → null on `success !== 1`
- `sleep()` utility added (used in Step 4 for rate limiting)

## Step 1 — 2026-03-11 — Next.js 15 App Router init
- Files: `package.json`, `tsconfig.json`, `next.config.js`, `.env.local`, `.eslintrc.json`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `types/index.ts`
- Decisions: Space Grotesk font (Inter/Arial banned) · accent `#c8f135` phosphor lime (purple banned) · bg `#09090b` · all shared types in `types/index.ts`
