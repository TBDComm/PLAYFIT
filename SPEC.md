# GUILDELINE — Project Specification

> **North Star:** Guildeline is evolving from a personal Steam-based game recommender into a **taste-based multiplayer gamer hub**. Every active phase should advance either (a) the core tag-profile engine or (b) community primitives that share it. See `memory/project_ultimate_vision.md`.

---

## Phase Status

| Phase | Scope | Status |
|-------|-------|--------|
| A–S | MVP → Auth → SEO → UX polish → Library picker | ✅ archived → `SPEC_archive.md` |
| **CE-1–CE-31** | Completeness & Experience (UX, a11y, forms) | ✅ 2026-04-11 → `SPEC_archive.md §Phase CE` |
| **SQ-1–SQ-6** | **Squad MVP (Phase SQ P1)** — taste-based LFG | ⏳ **active** |
| SQ-7–SQ-10 | Game Boards (Phase SQ P2) — per-game comments | 🕑 planned |
| SQ-11–SQ-15 | Public Profiles (Phase SQ P3) — viral + IGDB | 🕑 planned |

---

## Section Index — Phase SQ (read only the lines you need)

Use `Read(file_path, offset, limit)` with the range shown to avoid loading the whole SPEC. Ranges are approximate and widen by ~5 lines for context.

| Step | What | Lines | Files it touches |
|------|------|-------|------------------|
| Phase SQ preamble | Scope, constraints, plan pointer | 45–59 | — |
| SQ-1 | `squad_sessions` SQL migration | 60–72 | `supabase/migrations/20260412_squad.sql` |
| SQ-2 | `lib/squad.ts` pure functions (buildTagProfile, mergeTagProfiles, calcMatchScore, analyzeSquad) | 73–87 | `lib/squad.ts` |
| SQ-3 | `getSquadRecommendations` Claude helper | 88–102 | `lib/claude.ts` |
| SQ-4 | `POST /api/squad` edge route (main orchestrator) | 103–129 | `app/api/squad/route.ts`, `types/index.ts`, `lib/supabase.ts` |
| SQ-5 | `/squad` input page | 130–148 | `app/squad/page.tsx`, `page.module.css`, `loading.tsx` |
| SQ-6 | `/squad/[token]` share page | 149–170 | `app/squad/[token]/page.tsx` + css + loading, `lib/supabase.ts` |
| SQ-7–SQ-10 outline | Game Boards (P2) | 171–179 | — |
| SQ-11–SQ-15 outline | Public Profiles (P3) | 180–187 | — |

**When starting a step, copy that section verbatim into HANDOVER.md's ACTIVE STEP** — future sessions for the same step then skip SPEC.md entirely. This is already mandated in `CLAUDE.md` but the line range makes the initial read cheap.

**Other lookups:**
- Ultimate vision framing → `memory/project_ultimate_vision.md`
- Approved implementation plan (subrequest budget, commit order, reused utilities table, verification steps) → `/home/user/.claude/plans/purrfect-mapping-pelican.md`
- Completed phase detail → `SPEC_archive.md` (has its own section index at top)
- Current session state → `HANDOVER.md`

---

## Phase SQ — Community Expansion (SQ-1 through SQ-15)

Three community primitives built on the existing tag-profile engine. See North Star above.

**Constraints carried through Phase SQ:**
- CF Workers free plan: 50 subrequests/invocation (Squad MVP budget: ~32 for 4 members).
- Edge runtime required for all new routes (`export const runtime = 'edge'`).
- Supabase client: `@supabase/ssr` + `serviceSupabase` (never `@supabase/auth-helpers-nextjs`).
- Early user base → viral-share-first design; no realtime, no presence, no chat.
- IGDB deferred to P3 pending AdSense approval (commercial-use clause).

**Authoritative implementation plan:** `/home/user/.claude/plans/purrfect-mapping-pelican.md` (subrequest budget, commit order, reused utilities, verification).

---

### SQ-1 — DB migration: `squad_sessions`

**Files:** `supabase/migrations/20260412_squad.sql` (new)

**Spec:**
- Create `public.squad_sessions` with columns: `id uuid PK`, `share_token text unique`, `host_user_id uuid null references auth.users`, `member_steam_ids text[]`, `member_count int`, `merged_profile jsonb`, `result_cards jsonb`, `match_scores jsonb`, `avg_match_score int`, `top_shared_tags text[]`, `conflict_tags text[]`, `budget_krw int null`, `free_only boolean default false`, `created_at timestamptz default now()`, `expires_at timestamptz default now() + interval '7 days'`.
- Indexes: `share_token`, `expires_at`.
- RLS enabled. Policies: public SELECT where `expires_at > now()`; INSERT where `auth.uid() = host_user_id OR host_user_id IS NULL` (anon hosts allowed).

**Out of scope:** `games_cache` column extension (no IGDB in P1). `score_candidates` RPC changes (reuse existing signature). Cron cleanup of expired rows (P3).

---

### SQ-2 — `lib/squad.ts` (pure functions)

**Files:** `lib/squad.ts` (new)

**Spec:**
- `buildTagProfile(games, gameTags)`: inputs `Map<number, Record<string, number>>` tags and member's `playHistory` → normalized `TagProfile` using the existing `voteCount × √playtime_hours` formula (same as `/api/generate-recommendation` inline logic; extract and reuse).
- `mergeTagProfiles(profiles, { presenceThreshold })`: N profiles → consensus profile. For `memberCount >= 4`, auto-apply `presenceThreshold = 0.7` (tag must appear in ≥70% of members to survive).
- `calcMatchScore(individual, group)`: cosine similarity → 0–100 integer.
- `analyzeSquad(members)`: orchestrator returning `{ mergedProfile, matchScores, avgMatchScore, topSharedTags, conflictTags, allExcludedAppIds }`.
- All functions pure (no network, no DB). No test runner in project — verify by UI flow.

**Out of scope:** Persisting intermediate profiles, weighting by host's `user_tag_weights` beyond the host member.

---

### SQ-3 — `lib/claude.ts`: `getSquadRecommendations`

**Files:** `lib/claude.ts` (modify)

**Spec:**
- Add `getSquadRecommendations(candidates, ctx)` alongside existing `getRecommendations`. `ctx` carries `memberCount`, `avgMatchScore`, `topSharedTags`, `conflictTags`, `budget`, `freeOnly`.
- Prompt strategy: base on existing single-user prompt; inject "N명이 함께 즐길 게임" context, topSharedTags as hard preference, conflictTags as soft avoidance.
- Target output: **5 recommendations** (single-user returns 10; squad favors sharper consensus).
- Model: reuse `claude-haiku-4-5`. Keep existing `max_tokens` — never change hardcoded values without asking.
- Wrap response in try-catch + JSON.parse defense.

**Out of scope:** Changing single-user `getRecommendations`, swapping models.

---

### SQ-4 — `app/api/squad/route.ts`

**Files:** `app/api/squad/route.ts` (new), `types/index.ts` (modify), `lib/supabase.ts` (modify — add `saveSquadSession`)

**Spec:**
- `export const runtime = 'edge'`. Parse body via `await req.json()`; never `req.nextUrl`.
- Request: `{ memberUrls: string[], budget: number | null, freeOnly: boolean }`.
- Validate: 2 ≤ `memberUrls.length` ≤ 4, each parses via `parseSteamUrl` (with `resolveVanityUrl` fallback).
- Host session: `createServerClient` + cookies → `hostUserId` (nullable; anon hosts allowed per RLS).
- DB readiness: `isDbReady()`.
- Steam fetch: **sequential** `for...of` loop with `await sleep(200)` between calls. Never `Promise.all` on Steam (rate limit + subrequest burst). Skip `PRIVATE_PROFILE` / `INSUFFICIENT_HISTORY` members; require ≥2 valid survivors.
- `allAppIds = union(members.ownedAppIds)` → `getTagsForGames(allAppIds)` (1 call).
- `getUserTagWeights(hostUserId ?? hostSteamId)` — **host only**. Other members use unweighted profiles (subrequest budget).
- `analyzeSquad(members)` → consensus.
- `scoreCandidates(mergedProfile, hostWeights, allExcludedAppIds.map(String), 50)` — reuse existing 4-param RPC signature; `p_owned_appids` expects `text[]`.
- Price filter: `getGamePriceCache(candidateAppids)` → hits/misses. Cap misses at **`.slice(0, 10)`** before calling `getGameDetails` (subrequest budget; CF free plan hard 50).
- `upsertGamePriceCache` for each fetched price (fire-and-forget, but counts toward subrequest budget — 10 max).
- Apply budget / `freeOnly` → top 20 candidates → `getSquadRecommendations`.
- `shareToken`: `crypto.randomUUID().replace(/-/g, '').slice(0, 10)` (edge-safe; no `nanoid` dependency).
- Persist via `serviceSupabase.from('squad_sessions').insert(...)` (bypass RLS).
- Response: `{ shareToken, shareUrl: '/squad/' + shareToken, ...analysis, recommendations }`.
- Error codes: extend `ErrorCode` union in `types/index.ts` with `'ALL_PRIVATE'` and `'NOT_ENOUGH_MEMBERS'`. Reuse `INVALID_URL`, `AI_PARSE_FAILURE`, `DB_NOT_READY`, `GENERAL_ERROR`.

**Out of scope:** Realtime updates, per-member weights, multiple output sets.

---

### SQ-5 — `/squad` input page

**Files:** `app/squad/page.tsx`, `app/squad/page.module.css`, `app/squad/loading.tsx` (all new)

**Spec:**
- Client component, patterned after `RecommendationForm`.
- Steam URL inputs: 2 fixed rows + "멤버 추가" button (max 4). Each row has a delete button.
- If `useAuth().authState === 'steam'` or `'linked'` with `steamId`: prefill first row with host's Steam URL.
- Budget field + free-only toggle — reuse RecommendationForm styles (`.input`, `.urlInputWrap`, `.modeToggle`, `.button`).
- URL validation: `/steamcommunity\.com\/(id|profiles)\//` → `urlValid` ✓ icon.
- Submit → `POST /api/squad` → `LoadingOverlay` ("스쿼드 취향 분석 중…") → `router.push('/squad/' + shareToken)`. Never render results inline — the shared page is canonical.
- Error surfaces via existing `.manualNotice` / `.fieldError` patterns; focus first error via `errorRef` + `tabIndex={-1}` (CE-27 pattern).
- Keyboard a11y: Tab order through rows, submit reachable, `aria-live` for row add/remove.
- `loading.tsx`: skeleton reusing CE-16 `.bone` shimmer pattern (inputs + button placeholders).

**Out of scope:** Non-Steam guest mode (survey), manual mode, saving draft between sessions.

---

### SQ-6 — `/squad/[token]` share page

**Files:** `app/squad/[token]/page.tsx`, `app/squad/[token]/page.module.css`, `app/squad/[token]/loading.tsx` (all new), `lib/supabase.ts` (add `getSquadSession`)

**Spec:**
- Server component. `export const runtime = 'edge'` + `export const dynamic = 'force-dynamic'`. **Never** `generateStaticParams` (edge incompatible — CLAUDE.md rule).
- `getSquadSession(token)` in `lib/supabase.ts`: SELECT with `expires_at > now()` filter. If null → `notFound()`.
- Layout:
  1. Header: `← 홈으로` + created date + "이 스쿼드 공유하기" button (copies URL to clipboard).
  2. Summary hero: large `{avg_match_score}%` with label "평균 취향 일치율"; member count (N명) — **never display Steam IDs** (privacy).
  3. Per-member match pills: `멤버 1 · 82%` style; no identifying info.
  4. Tag sections: "모두가 좋아하는" (topSharedTags, always shown) + "취향이 갈리는" (conflictTags, only if length > 0).
  5. Recommendation cards: **reuse `/result/[id]/page.module.css`** card classes (`.card`, `.cardBody`, `.cardName`, `.meta`, `.reason`, `.tagRow`, etc.). No duplicate card styling in this module.
  6. Footer CTA: "나도 내 스쿼드 만들기 →" linking `/squad` (viral loop).
- `generateMetadata`: dynamic `<title>` = `"스쿼드 평균 {avg_match_score}% 일치 — Guildeline"`; description mentions top shared tags. OG image: inherit site default from `layout.tsx` (custom OG deferred to SQ-13).
- `loading.tsx`: skeleton mirroring layout (CE-16 `.bone` pattern — summary, tag rows, 5 card bones).
- Accessibility: `<main aria-label="스쿼드 결과">`, avg_match_score read via `aria-label="평균 일치율 {n}퍼센트"`.

**Out of scope:** Re-running analysis from shared URL, editing the squad after creation, comments on shared page.

---

### Phase SQ-2 (outline only — flesh out when starting SQ-7)

- **SQ-7** — `game_comments` table (id, appid, user_id, body ≤500 chars, parent_id nullable, created_at) + RLS (read public, write authed, delete own).
- **SQ-8** — `/api/games/[appid]/comments` GET/POST/DELETE (edge). Rate limit: 5 comments/hour/user, enforced via SELECT-count gate.
- **SQ-9** — `/games/[appid]` bottom section replacing the old "커뮤니티 기능 곧 출시" placeholder (removed in CE-10). Plain text + newlines only. No markdown, no images, no polling, no realtime.
- **SQ-10** — Moderation: owner delete, hard rate limit, report link (mailto for MVP).

---

### Phase SQ-3 (outline only — flesh out when starting SQ-11)

- **SQ-11** — `user_profiles` extension (`display_name`, `bio`, `is_public boolean default false`). Settings page edit UI.
- **SQ-12** — `/users/[userId]` public taste page: top tags, saved-games count, squad-history count. Edge runtime + `force-dynamic`.
- **SQ-13** — `@vercel/og` OG cards for `/squad/[token]` and `/users/[userId]` (viral share unlock). Verify CF Pages `next/og` compatibility first.
- **SQ-14** — Squad history list on own profile (`squad_sessions` where `host_user_id = auth.uid()`).
- **SQ-15** — IGDB integration re-evaluation (AdSense approval gate). Contact `partner@igdb.com` if pursuing commercial use.

---