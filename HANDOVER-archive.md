# HANDOVER Archive

## A1 — 2026-03-13 — Supabase schema
- Files: Supabase SQL migration (manual)
- Tables: `games_cache` (appid, name, genres TEXT[], tags JSONB), `user_tag_weights` (steam_id, tag, weight), `feedback` (+ tag_snapshot column)
- All tables created in Supabase dashboard; no local migration file

## Step 10 — 2026-03-13 — Cloudflare Pages 배포 설정
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
