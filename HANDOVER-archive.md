# HANDOVER Archive

## B3 — 2026-03-16 — Header + Google OAuth modal + auth callback
- Files: `app/components/Header.tsx`, `app/components/Header.module.css`, `app/api/auth/callback/route.ts`, `app/layout.tsx`
- Decisions: `createBrowserClient` used (not `createClientComponentClient` — not exported in v0.15); `@supabase/ssr` v0.9 uses `getAll`/`setAll`; `NextRequest` needed in callback to access `cookies.getAll()`
- Watch out: Steam button redirects to `/api/auth/steam` (B4); email OTP added in B7 (was not post-MVP)
- Build: `tsc --noEmit` passed ✅

## B1 + B2 — 2026-03-16 — Supabase schema additions
- SQL only: `user_profiles` table created; `user_id UUID` added to `user_tag_weights` (+ unique constraint on user_id+tag) + `feedback`
- Decisions: `steam_id` kept — pre-login weights migrate on B4-link (`UPDATE ... WHERE user_id IS NULL`)
- Build: no code changes; SQL run in Supabase dashboard ✅

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
