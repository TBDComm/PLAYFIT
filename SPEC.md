# GUILDELINE — Project Specification

> Read only the relevant section before implementing a step — do not read the full file.
> Addendum sections override the original spec where they conflict.
> Completed standalone specs (SteamSpy API, DB build script, Feedback weight logic) → `SPEC_archive.md`

---

## §Pre-A6 — Scoring Fixes (implement before A6)

### Fix 1: 2-button feedback

**Intent:** neutral 버튼 제거. 모든 피드백 버튼이 user_tag_weights에 영향. 버튼 안 누름 = 변화 없음.

`types/index.ts`:
```typescript
// Before
export type FeedbackRating = 'positive' | 'neutral' | 'negative'
// After
export type FeedbackRating = 'positive' | 'negative'
```

`app/result/page.tsx`: "한번 해볼게요" 버튼 제거. "잘 맞아요"(positive) · "아니에요"(negative) 만 유지.

`app/api/feedback/route.ts`:
```typescript
// line 23 — Before
const rating = (body.rating === 'positive' || body.rating === 'negative' || body.rating === 'neutral')
  ? body.rating as FeedbackRating : null
// After
const rating = (body.rating === 'positive' || body.rating === 'negative')
  ? body.rating as FeedbackRating : null

// line 33 — Before
const weightFetchNeeded = rating !== 'neutral' && !!steam_id && tag_snapshot.length > 0
// After
const weightFetchNeeded = !!rating && !!steam_id && tag_snapshot.length > 0
```

Weight deltas 변경 없음: positive null→1.2 / +0.2 (max 3.0), negative null→0.7 / -0.3 (min 0.1)

---

### Fix 2: Playtime-proportional scoring

**Intent:** 더 많이 플레이한 게임의 태그가 스코어에 비례 반영. sqrt 감쇠로 장르 특성상 긴 게임(RPG/MMO)이 과도하게 지배하는 문제 상쇄.

**수식:** `score = SUM(candidate_tag_votes × user_weight × normalized_profile_value)`
- `profile_value(tag)` = SUM(tag_vote_count × sqrt(playtime_hours)) across played games
- normalized = profile_value / max(all profile_values) → [0, 1]
- sqrt 효과: 500h vs 50h = raw 10배 → 3.2배로 완화

**Step 1 — Supabase SQL Editor에서 실행 (먼저):**
```sql
CREATE OR REPLACE FUNCTION score_candidates(
  p_tag_profile JSONB,
  p_user_tag_weights JSONB,
  p_owned_appids TEXT[],
  p_limit INT DEFAULT 50
)
RETURNS TABLE(appid TEXT, name TEXT, tags JSONB, score FLOAT8)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.appid,
    g.name,
    g.tags,
    (
      SELECT COALESCE(SUM(
        (t.value)::float8
        * COALESCE((p_user_tag_weights->>t.key)::float8, 1.0)
        * COALESCE((p_tag_profile->>t.key)::float8, 0.0)
      ), 0.0)
      FROM jsonb_each_text(g.tags) AS t(key, value)
      WHERE p_tag_profile ? t.key
    ) AS score
  FROM games_cache g
  WHERE NOT (g.appid = ANY(p_owned_appids))
    AND g.tags IS NOT NULL
    AND g.tags != '{}'::jsonb
  ORDER BY score DESC
  LIMIT p_limit;
$$;
```

**Step 2 — `app/api/recommend/route.ts` tagProfile 빌드 부분:**
```typescript
// Before (line ~47)
tagProfile[tag] = (tagProfile[tag] ?? 0) + voteCount * game.playtime_hours

// After
tagProfile[tag] = (tagProfile[tag] ?? 0) + voteCount * Math.sqrt(game.playtime_hours)
```

**Step 3 — 정규화 추가 (tagProfile 루프 직후):**
```typescript
const maxProfileVal = Math.max(...Object.values(tagProfile))
if (maxProfileVal > 0) {
  for (const tag of Object.keys(tagProfile)) {
    tagProfile[tag] = tagProfile[tag] / maxProfileVal
  }
}
```

**Step 4 — git push → 테스트**

---

## Service Definition

A web service that recommends Steam games based on the user's own play history and budget.
**Core principle: "User data over recommender's opinion"** — every feature, every line of copy must serve this.

---

## Tech Stack — Never suggest alternatives

| Role | Tool |
|------|------|
| Frontend + Backend | Next.js 15, App Router, TypeScript strict mode |
| AI | Claude API — `claude-haiku-4-5` only |
| Game data | Steam Web API + SteamSpy API (both free) |
| Feedback storage | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |

---

## File Structure

```
playfit/
├── app/
│   ├── page.tsx               # Main page (Steam mode + manual input toggle)
│   ├── result/page.tsx        # Result page
│   ├── globals.css
│   ├── components/
│   │   └── Header.tsx         # Auth header — login/logout [Addendum B7]
│   └── api/
│       ├── steam/route.ts     # Steam API wrapper
│       ├── recommend/route.ts # Claude API call (Steam + manual mode)
│       ├── feedback/route.ts  # Supabase write + tag weight update
│       ├── search/route.ts    # Autocomplete from games_cache [Addendum A7]
│       └── auth/
│           ├── steam/route.ts          # Steam OpenID redirect [Addendum B4]
│           └── steam/callback/route.ts # Steam OpenID callback [Addendum B4]
├── lib/
│   ├── steam.ts               # Steam utils + sleep
│   ├── claude.ts              # Claude utils
│   └── supabase.ts            # Supabase client
├── scripts/
│   └── build-games-db.ts      # One-time DB build script [Addendum A2]
├── types/
│   └── index.ts               # Shared types
└── .env.local
```

---

## Service Flow

**Steam mode (original):**
```
1. User enters Steam profile URL + optional budget (KRW)
2. Steam API → resolve URL to SteamID64 → fetch owned games
3. [Addendum] Look up tags for played games from games_cache
4. [Addendum] Score games_cache candidates by tag overlap → fetch real-time prices → filter by budget
5. Claude API → tag-based matching → select 5 games
6. Fetch price/rating/Korean support for 5 selected games only
7. Display 5 recommendation cards
8. User clicks feedback → save to Supabase + update user_tag_weights
```

**Manual mode (Addendum A6–A9):**
```
1. User toggles to manual mode → enters up to 5 games + playtime manually
2. Look up tags for entered games from games_cache
3. Score candidates, fetch prices, filter → same as steps 4–8 above
```

---

## Steam API Specification

**1. Resolve Steam URL to SteamID64**
```
GET https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/
params: key={STEAM_API_KEY}, vanityurl={vanity}
```
- URL contains `/profiles/{digits}` → extract directly, skip this call
- `response.success !== 1` → return `INVALID_URL`

**2. Fetch owned games**
```
GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/
params: key={STEAM_API_KEY}, steamid={steamid64}, include_appinfo=true, include_played_free_games=true
```
- `response.games` empty or undefined → `PRIVATE_PROFILE`
- total games < 5 → `INSUFFICIENT_HISTORY`
- Fields: `appid`, `name`, `playtime_forever` (minutes)

**3. Candidate appid source — [REPLACED by Addendum]**

~~`featuredcategories` real-time fetch~~ is fully replaced by `games_cache` DB query.
See **Candidate Selection Logic** section below.

**4. Game details — price fetch (5 games only)**
```
GET https://store.steampowered.com/api/appdetails?appids={appid}&cc=kr&l=korean
```
- Called only for the 5 Claude-selected games — not for all candidates
- Fields: `price_overview.final` (÷100 = KRW), `is_free`, `metacritic.score`, `supported_languages`
- Store URL: `https://store.steampowered.com/app/{appid}`
- 200ms delay between calls

---

## Candidate Selection Logic [Addendum — replaces real-time Steam fetch]

**Steps (runs inside `/api/recommend`):**

1. Fetch user's play history via Steam API (unchanged — top 15 by playtime)
2. For each played game, look up `tags` from `games_cache`
3. Build user tag profile: aggregate tags weighted by `playtime_hours`
4. Fetch `user_tag_weights` from Supabase for this `steam_id` (default `1.0` if no record)
5. Query `games_cache`:
   - Exclude appids the user already owns
   - Score each game: `sum of (tag_vote_count × user_tag_weight)` for overlapping tags
   - Sort by score descending, take top 50
6. Fetch real-time prices from Steam appdetails for top 50 candidates (200ms delay)
7. Filter by budget if set → `NO_GAMES_IN_BUDGET` if 0 pass
8. Pass final 30 candidates to Claude

---

## Claude API Specification [Addendum — tag-based prompts]

- **Model:** `claude-haiku-4-5` — never change
- **max_tokens:** 500
- **System prompt (exact):**
  ```
  You are a Steam game recommendation engine. Match games to the user's taste based on tag overlap with their play history. Respond ONLY in valid JSON.
  ```
- **User prompt (dynamic):**
  ```
  Play history (top 15 by playtime):
  [{name, playtime_hours, top_tags: ["tag1", "tag2", "tag3"]}]

  Candidate games:
  [{appid, name, top_tags: ["tag1", "tag2", "tag3"]}]

  Rules:
  - Select exactly 5 games with highest tag overlap to user history
  - Write recommendation reason in 1-2 Korean sentences
  - Reference specific games from user history in the reason
  - Never mention popularity or trending
  - Never recommend games the user already owns

  Response format:
  {"recommendations": [{"appid": "", "reason": ""}]}
  ```
- Send **only** `top_tags` to Claude — do not send price, rating, or Korean support
- `top_tags`: top 3 tag names by vote_count from `games_cache`
- After Claude selects 5 games: fetch real-time price/rating/Korean support for those 5 only, then return to frontend
- Always wrap in try-catch + JSON.parse defense → `AI_PARSE_FAILURE` on failure

---

## Supabase Specification

**All SQL is provided to the user to run in Supabase dashboard — never run automatically.**

**feedback table (original):**
```sql
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  steam_id TEXT,
  play_profile JSONB,
  rating TEXT CHECK (rating IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
`play_profile` = `[{name, playtime_hours}]` top 5 by playtime

**Addendum tables:**
```sql
-- Game metadata cache (built once, updated monthly)
CREATE TABLE games_cache (
  appid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  genres TEXT[],
  tags JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- tags format: {"Souls-like": 1200, "Difficult": 980, "Atmospheric": 750}
-- tags from SteamSpy, genres from Steam appdetails

-- Per-user tag preference weights
CREATE TABLE user_tag_weights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  steam_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(steam_id, tag)
);

-- Add tag_snapshot to feedback
ALTER TABLE feedback ADD COLUMN tag_snapshot JSONB;
-- stores top 3 tag names of the game at feedback time
-- e.g. ["Souls-like", "Difficult", "Atmospheric"]
```

**Addendum B tables (authentication — see Addendum B section):**
```sql
-- B1: Links Supabase auth user to their Steam account (✅ done)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  steam_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B2: Add user_id to user_tag_weights (DO NOT drop steam_id — pre-login data uses it)
ALTER TABLE user_tag_weights
  ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
ALTER TABLE user_tag_weights
  ADD CONSTRAINT user_tag_weights_user_tag_unique UNIQUE(user_id, tag);

-- B2: Add nullable user_id to feedback
ALTER TABLE feedback ADD COLUMN user_id UUID REFERENCES auth.users;
```

**Why steam_id is NOT dropped from user_tag_weights:**
Non-authenticated users accumulate tag weights by steam_id across multiple visits.
On login + Steam URL link (B4-link), those rows are migrated:
`UPDATE user_tag_weights SET user_id = ? WHERE steam_id = ?`
After migration, the row has both steam_id and user_id set. Future queries use user_id.

**Feedback route:** POST `{game_id, game_name, steam_id, play_profile, rating, tag_snapshot}` → insert → 200 or 500

---

## Manual Input Mode [Addendum A6–A8]

Add after Steam mode is fully tested (A9).

**UI addition on main page:**
- Toggle below Steam URL input: `스팀 계정 없이 추천받기`
- Switches main form to manual input: 5 rows of `[게임 이름 검색 (자동완성)] [플레이 시간 (시간)]`
- Same budget input and `내 게임 찾기` button

**`/api/search` route (A7):**
```
GET /api/search?q={query}
→ SELECT appid, name FROM games_cache WHERE name ILIKE '%{query}%' LIMIT 10
→ Return [{appid, name}]
```

**Autocomplete UI behavior (A7 — implement alongside the route in `app/page.tsx`):**

Row state shape: `{ appid: number | null, name: string, playtime: string }` (already in place from A6)

- On name input change: debounce 300ms → call GET /api/search?q={value} → show dropdown of [{appid, name}] results below the input
- Dropdown item click: set row to `{ appid: selected.appid, name: selected.name }` → close dropdown
- User edits name text after a game was selected (appid already set): reset `appid` to null (selection invalidated, re-search required)
- Input blur with name filled but `appid` still null: mark row as invalid → show inline error below the row: "드롭다운에서 게임을 선택해주세요"
- On submit: check all rows where `name.trim() !== ''` — if any have `appid === null`, block submit and show inline error on those rows
- Empty rows (name is empty): skip entirely — no error, no submission
- Minimum 1 valid row (name + appid + playtime all filled) required to enable submit button

**`/api/recommend` accepts two shapes (A8):**
```typescript
{ steamUrl: string, budget?: number }                          // Steam mode (existing)
{ manualGames: [{appid, name, playtime_hours}], budget?: number } // Manual mode
```
Manual mode skips all Steam API calls. Uses `manualGames` directly as play history.
No owned games to filter. Same tag extraction + scoring + Claude logic applies.

---

## Authentication [Addendum B]

### Core principle

Login is never required. All four user states coexist and the service functions fully in each.

| State | Tag weights storage | Steam URL |
|-------|---------------------|-----------|
| Non-authenticated | `user_tag_weights.steam_id` — persists across visits by Steam URL | Enter every time |
| Logged in, Steam not linked | `user_tag_weights.user_id` — starts fresh (no prior data) | Enter every time |
| Logged in, Steam linked (migrated) | `user_tag_weights.user_id` — pre-login data migrated in | Steam URL saved in `user_profiles` |
| Steam authenticated | `user_tag_weights.user_id` | Auto-fetched from `user_profiles` |

**Migration flow (B4-link):**
User logs in → popup asks for Steam URL → user enters URL → system:
1. Resolves URL to `steam_id`
2. Sets `user_profiles.steam_id = steam_id` for this user
3. Runs `UPDATE user_tag_weights SET user_id = {user_id} WHERE steam_id = {steam_id}`
4. Popup closes — data from all prior non-authenticated visits is now linked

If user closes popup without linking: a **[Steam 연동]** button persists next to the logout button, re-opening the same popup at any time.

---

### Supabase Auth configuration

- **Email login:** enable email + password provider in Supabase Auth dashboard
- **Google login:** enable Google OAuth provider in Supabase Auth dashboard — requires Google Cloud OAuth 2.0 credentials; ask user before implementing
- **Steam login:** not natively supported by Supabase Auth — custom Steam OpenID 2.0 implementation required (see routes below)

---

### Steam OpenID 2.0 routes

**`/api/auth/steam/route.ts`** — constructs and redirects to Steam OpenID login URL

Required parameters:
```
openid.ns:         http://specs.openid.net/auth/2.0
openid.mode:       checkid_setup
openid.return_to:  {NEXT_PUBLIC_BASE_URL}/api/auth/steam/callback
openid.realm:      {NEXT_PUBLIC_BASE_URL}
openid.identity:   http://specs.openid.net/auth/2.0/identifier_select
openid.claimed_id: http://specs.openid.net/auth/2.0/identifier_select
```
Redirect destination: `https://steamcommunity.com/openid/login`

**`/api/auth/steam/callback/route.ts`** — handles return from Steam after authentication

1. Receive all `openid.*` query parameters from Steam redirect
2. Validate: POST to `https://steamcommunity.com/openid/login` with `openid.mode=check_authentication` and all received parameters
3. If `is_valid:false` → return `STEAM_AUTH_INVALID`
4. Extract `steamid64` from `openid.claimed_id` (format: `https://steamcommunity.com/openid/id/{steamid64}`)
5. Query `user_profiles` for existing row with this `steam_id`
6. If found: retrieve linked `auth.users` entry, create Supabase session via admin client
7. If not found: create new `auth.users` entry via admin client (synthetic email: `{steamid64}@steam.playfit`), then insert `user_profiles` row
8. Set session cookie → redirect to main page

`SUPABASE_SERVICE_ROLE_KEY` required for server-side user creation — never expose to frontend.

---

### Updated recommendation logic (B5)

`/api/recommend` — reads session server-side via Supabase `createServerClient`.

**Case 1 — Steam authenticated (steam_id in user_profiles):**
- Read `user_id` from session → look up `steam_id` from `user_profiles`
- Fetch play history via Steam API (no URL input required)
- Load `user_tag_weights` by `user_id` → run recommendation flow

**Case 2 — Logged in, Steam linked (email/Google + steam_id set in user_profiles):**
- Read `user_id` from session
- `steam_id` already in `user_profiles` → pre-fill Steam URL on frontend, fetch play history
- Load `user_tag_weights` by `user_id` → run recommendation flow

**Case 3 — Logged in, Steam NOT linked:**
- Read `user_id` from session
- User provides Steam URL manually (no pre-fill)
- Load `user_tag_weights` by `user_id` (may be empty → defaults to 1.0)
- Run recommendation flow

**Case 4 — Non-authenticated:**
- No session
- User provides Steam URL or manual game input
- Load `user_tag_weights` by `steam_id` (if steam URL provided) — accumulated pre-login data
- Run recommendation flow — weights never saved here (saving happens in /api/feedback)

---

### Updated feedback logic (B6)

`/api/feedback` — reads session server-side.

- **Valid session:** insert feedback row with `user_id`, update `user_tag_weights` by `user_id` (upsert on `user_id, tag`)
- **No session:** insert feedback row with `user_id: null`, `steam_id` (if provided), update `user_tag_weights` by `steam_id` (upsert on `steam_id, tag`)

---

### Steam link route (B4-link)

**`POST /api/auth/link-steam`** — links an existing steam_id to the logged-in user and migrates pre-login tag weights.

Request body: `{ steamUrl: string }`

Steps:
1. Verify session exists — return 401 if not
2. Parse `steamUrl` → resolve to `steam_id` (same logic as `/api/steam`)
3. Check `user_profiles` — if `steam_id` already linked to a different `user_id` → return 409
4. Update `user_profiles` SET `steam_id = steam_id` WHERE `id = user_id`
5. `UPDATE user_tag_weights SET user_id = {user_id} WHERE steam_id = {steam_id} AND user_id IS NULL`
   — only migrates rows not yet owned by any user
6. Return `{ ok: true, steam_id }`

`SUPABASE_SERVICE_ROLE_KEY` required (bypasses RLS for admin update).

---

### Frontend changes (B7)

**Header component** (`app/components/Header.tsx`, rendered in `app/layout.tsx`):

- **Non-authenticated:** `[로그인]` button → login modal (three options: 이메일 / Google / Steam)
- **Authenticated, Steam NOT linked:** `[로그아웃]` + `[Steam 연동]` button
- **Authenticated, Steam linked:** `[로그아웃]` (no link button — already linked)

**Login modal:**
- Three buttons: `이메일로 로그인` / `Google로 로그인` / `Steam으로 로그인`
- Email login: OTP flow — enter email → receive 6-digit code → verify (`supabase.auth.signInWithOtp` + `verifyOtp`)
- On successful login → modal closes → **Steam link popup opens automatically** (except Steam login — already linked)

**Steam link popup** (shown after login AND when [Steam 연동] button clicked):
- Title: "기존 Steam 데이터를 연동하세요"
- Input: Steam 프로필 URL
- Button: `연동하기` → calls `/api/auth/link-steam` → success closes popup
- `[닫기]` or outside-click closes popup without linking
- After closing without linking: `[Steam 연동]` button remains in header

**Main page — Steam authenticated (steam_id in user_profiles):**
- Hide Steam URL input
- Show `내 게임 추천받기` button in its place
- Budget input unchanged

**Main page — Email/Google authenticated, Steam linked:**
- Steam URL input pre-filled with linked steam_id's profile URL
- Budget input unchanged

**Main page — Email/Google authenticated, Steam NOT linked:**
- Steam URL input empty (user enters manually)
- Budget input unchanged

**Main page — Non-authenticated:**
- No changes from current behavior

---

### Implementation order

Complete each step fully before starting the next.
Provide SQL to user and wait for confirmation before any DB changes.
Ask for Google OAuth credentials before implementing Google login.

| Step | Description |
|------|-------------|
| B1 | Create `user_profiles` table | ✅ done |
| B2 | Alter `user_tag_weights` + `feedback` (add user_id, keep steam_id) |
| B3 | Email + Google auth — login modal, Supabase session, logout |
| B4 | `/api/auth/steam` + `/api/auth/steam/callback` — Steam OpenID |
| B4-link | `/api/auth/link-steam` — Steam URL → migrate weights to user_id |
| B5 | Update `/api/recommend` — all four cases |
| B6 | Update `/api/feedback` — user_id if session, steam_id if not |
| B7 | Header component + login modal + Steam link popup + main page per auth state |
| B8 | E2E test: email login → link Steam → recommend → feedback → return visit |
| B9 | E2E test: Steam login → auto recommend → feedback persistence |
| B10 | E2E test: non-authenticated → full flow → weights persist by steam_id |

---

## Error Codes

| Code | Trigger | Korean UI message |
|------|---------|-------------------|
| `PRIVATE_PROFILE` | games array empty or undefined | 스팀 프로필을 공개로 설정해주세요 |
| `INSUFFICIENT_HISTORY` | fewer than 5 owned games | 플레이 기록이 5개 이상 필요해요 |
| `NO_GAMES_IN_BUDGET` | 0 candidates pass filter | 예산 내 추천 가능한 게임이 없어요. 예산을 높여보세요 |
| `AI_PARSE_FAILURE` | Claude JSON parse fails | 분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요 |
| `INVALID_URL` | Steam URL format unrecognized | 올바른 스팀 프로필 URL을 입력해주세요 |
| `GENERAL_ERROR` | any other failure | 잠시 후 다시 시도해주세요 |
| `DB_NOT_READY` | games_cache is empty | DB가 아직 준비되지 않았어요 |
| `GAME_NOT_FOUND` | manual game not found in games_cache | 게임을 찾을 수 없어요 |
| `TAG_EXTRACTION_FAILED` | no tags found for played/entered games | 플레이 기록에서 태그를 추출할 수 없어요 |
| `STEAM_AUTH_INVALID` | Steam OpenID `is_valid:false` | Steam 로그인에 실패했어요. 다시 시도해주세요 |
| `STEAM_ID_NOT_LINKED` | authenticated user has no `steam_id` in `user_profiles` | Steam 계정이 연결되어 있지 않아요 |

---

## Scope

**Original MVP (Steps 1–10) — complete:**
- Steam URL input → SteamID → play history
- Budget input (KRW, optional)
- Claude API: analyze + recommend 5 games
- Game card: name, reason, price, rating, Korean support badge, store link
- Feedback: 3 buttons → save to Supabase

**Addendum (A1–A10):**
- Supabase games_cache + user_tag_weights (A1)
- DB build script from full Steam app list + SteamSpy tags (A2)
- Tag-based candidate selection from DB, not real-time Steam (A3–A4)
- Feedback → tag weight update (A5)
- Manual input mode UI (A6)
- /api/search autocomplete route (A7)
- /api/recommend: handle both Steam + manual modes (A8)
- End-to-end tests: Steam mode (A9), manual mode (A10)

**Addendum (B1–B10):**
- user_profiles table + table migrations (B1–B2)
- Email, Google, Steam login — session handling (B3–B4)
- Recommendation + feedback logic updated for all three auth states (B5–B6)
- Header UI + main page UI per auth state (B7)
- End-to-end tests for all three auth paths (B8–B10)

**Out of scope (do not add):** saved history, social features, sorting, filtering results

---

## UI Specification

### Main page (`app/page.tsx`)
**Steam mode elements (in order):**
1. Logo: **GUILDELINE**
2. Tagline: 나한테 맞는 게임을 찾아드립니다
3. Input: Steam profile URL — placeholder: 스팀 프로필 URL을 입력하세요
4. Input: Budget (optional) — placeholder: 예산 입력 (예: 10000) — 비우면 전체 가격대
5. Button: 내 게임 찾기
6. Toggle: 스팀 계정 없이 추천받기 [Addendum A8]
7. Loading state: 플레이 기록 분석 중...

**Manual mode elements (toggle activated) [Addendum A8]:**
- 5 rows: `[게임 이름 검색 (자동완성)] [플레이 시간 (시간)]`
- Same budget input and 내 게임 찾기 button
- Loading state: 취향 분석 중...

### Result page (`app/result/page.tsx`)
5 cards, each with:
- Game name
- `왜 나한테 맞냐면: {reason}`
- `₩{price}` or `무료`
- `{score}점` (only if metacritic score exists)
- `한국어 ✓` or `한국어 ✗`
- 스팀에서 보기 → store URL, new tab
- 잘 맞아요 👍 / 한번 해볼게요 🤔 / 아니에요 👎 → on click: disable all 3 + show 피드백 감사해요

### Design constraints
- Dark background (`#09090b` already set)
- No popularity ranks, trending badges, or rank numbers anywhere
- No purchase-urging language

---

## Environment Variables

```
STEAM_API_KEY=                 ← Step 2
ANTHROPIC_API_KEY=             ← Step 5
NEXT_PUBLIC_SUPABASE_URL=      ← Step 8
NEXT_PUBLIC_SUPABASE_ANON_KEY= ← Step 8
SUPABASE_SERVICE_ROLE_KEY=     ← Addendum B4 — server-side only, never expose to frontend
NEXT_PUBLIC_BASE_URL=          ← Addendum B4 — e.g. http://localhost:3000 in dev, production URL after deploy
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Steam appdetails rate limit | 200ms delay between calls |
| SteamSpy rate limit in build script | 200ms delay between calls |
| Build script crash mid-run | Skip appids with updated_at within 30 days → resumable |
| Claude JSON parse failure | try-catch + fallback `AI_PARSE_FAILURE` |
| Stale price data | Fetch appdetails in real-time for 5 selected games only |
| Private profile | `game_count === 0` in GetOwnedGames → `PRIVATE_PROFILE` |
| games_cache empty | Check row count before candidate query → `DB_NOT_READY` |
| Tag not found for played game | Skip that game's tags silently; if all fail → `TAG_EXTRACTION_FAILED` |
| Steam OpenID forgery | Validate assertion by re-posting to Steam — never trust claimed_id without verification |
| Service role key exposure | Used only in server-side API routes — never passed to frontend or logged |
| Non-authenticated feedback | Save feedback row with `null user_id` — tag weights skipped entirely, not defaulted |

---

## C-series — AdSense 광고 수익 극대화

> Read only the relevant C-step section before implementing. Each step is self-contained.
> Marketing skill references → `marketing-skills/` directory (seo-audit, analytics-tracking, schema-markup, programmatic-seo, page-cro, ai-seo, content-strategy, site-architecture)
> If `marketing-skills/` is missing (env reset): `git clone https://github.com/coreyhaines31/marketingskills /tmp/ms && cp -r /tmp/ms/skills ./marketing-skills`

### Strategy

Guildeline is currently a tool site. To maximize AdSense revenue it must expand into a content site.

**Revenue formula:** `Revenue = Traffic × RPM`
- Traffic: driven by SEO (programmatic game pages + blog)
- RPM: driven by ad placement quality + page content relevance

**Key asset:** `games_cache` holds 82,816 games → each becomes an SEO landing page.

**AdSense approval prerequisites:** Privacy Policy page, Terms of Service page, sufficient content, HTTPS (CF Pages handles this).

---

### Phase 1 — AdSense Foundation

#### C1 — Technical SEO Foundation

**Goal:** Make the site fully crawlable and indexable by Google and AI bots.

- `public/robots.txt` — allow all crawlers; explicitly allow Google, AdSense (`Mediapartners-Google`), and AI bots (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`); reference sitemap URL
- `app/sitemap.ts` — Next.js dynamic sitemap; include `/`, `/privacy`, `/terms`, `/blog`, all `/genre/[slug]` pages; defer `/games/[appid]` until C5 is done
- Canonical `<link>` tags — add to `app/layout.tsx` via `generateMetadata`; self-referencing canonical on every page
- Open Graph + Twitter meta tags — `og:title`, `og:description`, `og:url`, `og:type`; apply to layout (default) and override per page
- Verify no `noindex` on any live page

**Files:** `public/robots.txt` (new), `app/sitemap.ts` (new), `app/layout.tsx`

---

#### C2 — Legal Pages (AdSense Requirement)

**Goal:** Create Privacy Policy and Terms of Service pages — required for AdSense approval.

- `/privacy` (`app/privacy/page.tsx`) — Privacy Policy: data collected (GA4 analytics, Supabase auth), cookies, third-party services (Steam API, Google AdSense), contact info
- `/terms` (`app/terms/page.tsx`) — Terms of Service: service description, usage rules, disclaimer, no warranty
- Footer component (`app/components/Footer.tsx`) — rendered in `app/layout.tsx`; links: Privacy Policy · Terms · © 2026 Guildeline
- Both pages: plain prose, dark theme consistent with existing design, no fancy layout needed

**Files:** `app/privacy/page.tsx` (new), `app/terms/page.tsx` (new), `app/components/Footer.tsx` (new), `app/layout.tsx`

---

#### C3 — GA4 Analytics Setup

**Goal:** Instrument the site for traffic and conversion measurement before AdSense launch.

- Install `gtag.js` via Next.js `<Script>` in `app/layout.tsx` — measurement ID from env var `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Event tracking (client-side, via `gtag('event', ...)` helper in `lib/analytics.ts`):

| Event | Trigger |
|-------|---------|
| `recommendation_generated` | Successful result from `/api/recommend` |
| `feedback_submitted` | User clicks 잘 맞아요 / 아니에요 |
| `search_used` | User selects a game from autocomplete dropdown |
| `steam_login_started` | User clicks Steam 로그인 |
| `google_login_started` | User clicks Google 로그인 |

- Mark `recommendation_generated` as a conversion in GA4 Admin (user action after deploy)
- GA4 + AdSense link: done in GA4 Admin console (user action)

**Files:** `app/layout.tsx`, `lib/analytics.ts` (new)
**Env var:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` — user provides after creating GA4 property

---

### Phase 2 — Content Expansion

#### C4 — Site Architecture

**Goal:** Define URL structure and navigation for all new content pages before building them. URLs are designed with the long-term community vision in mind — reserve community routes now so structure never needs to break.

**URL structure:**
```
/ (main tool — unchanged)
/games/[appid]        ← C5: individual game pages → D-series: community hub per game
/genre/[slug]         ← C6: genre hub pages → D-series: community hub per genre
/blog                 ← C7: blog index
/blog/[slug]          ← C7: blog posts
/users/[userId]       ← RESERVED for D-series: public taste profile page (do not build yet — just reserve the URL pattern, ensure no conflict)
/privacy              ← C2: done
/terms                ← C2: done
```

**Community URL rationale:** `/users/[userId]` will become the public-facing taste profile page — showing a user's top tags, genres, and favorite games, visible to others for community matching. Reserved now so C5/C6 internal links can reference it in the future without a URL migration.

- Header update: add navigation links (Blog, 장르별 탐색) — mobile-responsive
- Footer update (from C2): confirm links include Blog + Genre index
- Breadcrumb component (`app/components/Breadcrumb.tsx`) — renders `Home > Genre > Game` etc.; used on C5/C6/C7 pages
- Genre index page (`app/genre/page.tsx`) — lists all genres from `games_cache` as links to `/genre/[slug]`

**Files:** `app/components/Header.tsx`, `app/components/Footer.tsx`, `app/components/Breadcrumb.tsx` (new), `app/genre/page.tsx` (new)

---

#### C5 — Game Detail Pages (Programmatic SEO)

**Goal:** Generate one SEO-optimized page per game in `games_cache` — the primary traffic driver.

**Programmatic SEO playbook:** `Profiles` pattern (one page per entity with unique data) + `Directory` support from C6. Proprietary data from `games_cache` (tag vote counts, genre lists) is the differentiator — public data anyone can use; our tag-weighted similarity scoring is ours alone. Per the programmatic-seo skill: each page must provide unique value beyond variable substitution — the "similar games" list (computed from our scoring algorithm) is the unique value per page.

**Route:** `app/games/[appid]/page.tsx`

**Page content (server-rendered):**
- H1: `{game name} — 비슷한 게임 추천`
- Game tags (top 10 from `games_cache`)
- Game genres
- "이 게임과 비슷한 게임 TOP 10" — run the existing tag-scoring logic server-side against `games_cache`, return top 10 similar games (no Steam API call, no Claude — pure DB query)
- Link to main tool: "내 플레이 기록으로 추천받기 →"
- Breadcrumb: Home > 게임 > {game name}

**Community placeholder (D-series hook):** render a static section "이 게임을 좋아하는 Guildeline 유저" with placeholder copy — no data yet, just the UI slot so the page structure is ready when D-series adds real user data.

**SEO:**
- `generateMetadata`: title = `{game name} 비슷한 게임 추천 | Guildeline`, description = `{game name}을 좋아한다면 이런 게임도 좋아할 거예요. Guildeline이 태그 기반으로 추천합니다.`
- Canonical: `/games/{appid}`
- Schema: `SoftwareApplication` JSON-LD (name, applicationCategory: Game, offers if free)
- Internal links: each similar game links to its own `/games/[appid]` + genre links to `/genre/[slug]`

**Data fetching:** `generateStaticParams` — NOT used (82k pages would time out build). Use `dynamicParams = true` + ISR (`revalidate = 86400`). Fetch game from `games_cache` by appid on request, cache for 24h.

**Thin content guard (per programmatic-seo skill):** if a game has no tags in `games_cache` (tags is null or `{}`), render a minimal page with `noindex` — do not pollute the index with empty pages.

**Sitemap update (C1 follow-up):** Add `/games/[appid]` entries — generate from top 5,000 games by tag count (most data-rich pages first); remaining pages indexed via crawl.

**Files:** `app/games/[appid]/page.tsx` (new), `app/sitemap.ts` (update)

---

#### C6 — Genre Hub Pages

**Goal:** One page per genre — targets "best {genre} games Steam" searches.

**Programmatic SEO playbook:** `Directory` pattern (curated list of entities in a category). Unique value: tag-weighted ranking within each genre, not just alphabetical or arbitrary lists — our scoring data differentiates this from generic "top games" lists.

**Route:** `app/genre/[slug]/page.tsx`

**Page content (server-rendered, ISR revalidate 86400):**
- H1: `최고의 {genre} 게임 추천 | Guildeline`
- Top 20 games in this genre from `games_cache` (by tag vote count sum)
- Each game: name, top 3 tags, link to `/games/[appid]`
- "내 취향에 맞는 {genre} 게임 찾기 →" CTA to main tool
- Breadcrumb: Home > 장르 > {genre}
- Community placeholder (D-series hook): "{genre} 게임을 좋아하는 유저들" — static copy, no data yet

**SEO:**
- `generateMetadata`: title = `최고의 {genre} 게임 20선 | Guildeline`, description = dynamic per genre
- Schema: `ItemList` JSON-LD listing the 20 games

**Slug format:** genre name lowercased, spaces → hyphens (e.g., `role-playing-games`)
**Genre source:** distinct `genres` array values from `games_cache`

**Files:** `app/genre/[slug]/page.tsx` (new), `app/genre/page.tsx` (update with genre list)

---

#### C7 — Blog Section

**Goal:** Long-form content for longtail SEO and E-E-A-T signals.

**Routes:** `app/blog/page.tsx` (index), `app/blog/[slug]/page.tsx` (post)

**Content storage:** MDX files in `content/blog/[slug].mdx` — frontmatter: `title`, `description`, `publishedAt`, `tags`

**First 3 posts (to be written during implementation):**
1. `steam-game-recommendation-guide` — "내 취향에 맞는 스팀 게임 찾는 법"
2. `best-rpg-games-steam-2026` — "2026년 스팀 RPG 게임 추천"
3. `steam-playtime-and-taste` — "플레이 시간이 취향을 알려준다 — 스팀 데이터 분석"

**Schema:** `BlogPosting` JSON-LD per post (headline, datePublished, author: Guildeline, url)
**Breadcrumb:** Home > Blog > {post title}

**Files:** `app/blog/page.tsx` (new), `app/blog/[slug]/page.tsx` (new), `content/blog/*.mdx` (new), `lib/blog.ts` (new — MDX loader)

---

### Phase 3 — AdSense Integration

#### C8 — AdSense Technical Setup

**Goal:** Wire up AdSense script and ads.txt so the site can serve ads.

**Prerequisites (user actions before this step):**
1. Apply for Google AdSense at adsense.google.com
2. Submit Guildeline URL for review (requires C2 legal pages + sufficient content from C5–C7)
3. Receive Publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`)

**Implementation:**
- `public/ads.txt` — `google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
- AdSense auto-ads script in `app/layout.tsx` via `<Script>` with `strategy="afterInteractive"` — only when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` env var is set
- `app/components/AdUnit.tsx` — reusable component wrapping `<ins class="adsbygoogle">` — accepts `slot`, `format`, `responsive` props; renders nothing if env var not set (safe for dev)

**Env var:** `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (ca-pub-XXXXXXXXXXXXXXXX)
**Files:** `public/ads.txt` (new), `app/layout.tsx`, `app/components/AdUnit.tsx` (new)

---

#### C9 — Ad Placement Strategy

**Goal:** Place ads for maximum RPM without harming UX (which would hurt AdSense quality score).

**Placement plan per page type:**

| Page | Placement | Format |
|------|-----------|--------|
| Game detail (`/games/[appid]`) | After similar games list | In-content, responsive |
| Genre hub (`/genre/[slug]`) | Between game list rows (after item 10) | In-list |
| Blog post (`/blog/[slug]`) | After intro (¶2–3) + end of post | In-article |
| Main tool result (`/result`) | Below 5 game cards | Display, responsive |
| Blog index (`/blog`) | Sidebar or below fold | Display |

**Rules:**
- No ads above the fold on the main tool page (harms tool UX → user leaves → lower RPM)
- No ads that shift layout on load (CLS penalty — AdSense quality score + Core Web Vitals)
- All `<AdUnit>` components wrapped in a fixed-height container to prevent CLS
- Mobile: max 1 ad per screen viewport

**Files:** `app/games/[appid]/page.tsx`, `app/genre/[slug]/page.tsx`, `app/blog/[slug]/page.tsx`, `app/result/page.tsx`

---

### Phase 4 — SEO Enhancement

#### C10 — Schema Markup

**Goal:** Structured data across all page types for rich results and AI citation.

| Page | Schema type |
|------|-------------|
| `/` (main) | `WebApplication` + `Organization` |
| `/games/[appid]` | `SoftwareApplication` + `BreadcrumbList` |
| `/genre/[slug]` | `ItemList` + `BreadcrumbList` |
| `/blog/[slug]` | `BlogPosting` + `BreadcrumbList` |
| All pages | `WebSite` (homepage only, with `SearchAction`) |

Implementation: server-rendered JSON-LD `<script>` in each page's `generateMetadata` or inline in the page component. Use `@graph` to combine multiple types per page.

**Files:** `app/components/JsonLd.tsx` (new — generic JSON-LD renderer), all page files updated

---

#### C11 — On-Page SEO Optimization

**Goal:** Ensure every page type has optimized titles, descriptions, headings, and internal links.

**Meta title templates:**
- Game page: `{name} 비슷한 게임 추천 | Guildeline`
- Genre page: `최고의 {genre} 게임 20선 | Guildeline`
- Blog post: `{title} | Guildeline`
- Main: `내 스팀 취향에 맞는 게임 추천 | Guildeline`

**Internal linking:**
- Game pages → link to their genre pages
- Genre pages → link to top 20 game pages + main tool
- Blog posts → link to relevant game/genre pages + main tool
- Main page footer → Blog, 장르 탐색

**H1/H2 audit:** ensure every page has exactly one H1; headings follow logical hierarchy.

**Files:** all page files

---

#### C12 — AI SEO

**Goal:** Make content citable by AI assistants (ChatGPT, Perplexity, Claude, Google AI Overviews).

- `robots.txt` (C1 already covers AI bots — verify correct)
- Game pages: add FAQ block — "Q: {game name}과 비슷한 게임은? A: 태그 기반으로 {top 3 similar games}을 추천합니다."
- Genre pages: add definition block — "{genre}란 {genre description}입니다. Guildeline에서 추천하는 상위 게임은 {top 3}입니다."
- Blog posts: structured with clear H2 questions, definition in first paragraph, statistics with sources
- All pages: add `dateModified` to schema; blog posts show "마지막 업데이트" date visibly

**Files:** `app/games/[appid]/page.tsx`, `app/genre/[slug]/page.tsx`, `app/blog/[slug]/page.tsx`

---

### Phase 5 — Performance

#### C13 — Core Web Vitals Optimization

**Goal:** Pass Core Web Vitals thresholds (LCP < 2.5s, CLS < 0.1, INP < 200ms) — affects both AdSense quality score and Google rankings.

- All images → `next/image` with explicit `width`/`height` (prevents CLS)
- Fonts → `next/font` (eliminates FOUT/CLS from font swap)
- Ad containers → fixed height wrapper (prevents CLS from ad load)
- Game/genre pages: check TTFB — ISR cache should serve sub-200ms after first request
- Defer non-critical scripts (`analytics.ts` events) to `requestIdleCallback`
- Run PageSpeed Insights after deploy; target score ≥ 90 mobile

**Files:** all image-bearing pages, `app/layout.tsx`

---

### C-series Implementation Order

| Step | Description | Phase |
|------|-------------|-------|
| C1 | robots.txt, sitemap.xml, canonical, OG tags | Foundation |
| C2 | /privacy, /terms, Footer | Foundation |
| C3 | GA4 + event tracking | Foundation |
| C4 | Site architecture, nav update, breadcrumb, genre index | Content |
| C5 | Game detail pages `/games/[appid]` (ISR) | Content |
| C6 | Genre hub pages `/genre/[slug]` | Content |
| C7 | Blog section + first 3 posts | Content |
| C8 | AdSense script, ads.txt, AdUnit component | AdSense |
| C9 | Ad placement on all page types | AdSense |
| C10 | Schema markup sitewide | SEO |
| C11 | Meta titles, internal linking, H1/H2 audit | SEO |
| C12 | AI SEO — FAQ blocks, definition blocks, freshness | SEO |
| C13 | Core Web Vitals — images, fonts, ad CLS | Performance |

**User actions required:**
- Before C3: create GA4 property → provide `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Before C8: apply for AdSense → wait for approval → provide `NEXT_PUBLIC_ADSENSE_CLIENT_ID`

---

## Phase 6 — Product Experience (FT-series)

**Context:** C1–C13 complete. Site is technically solid but feels like a prototype — just a centered form with no value proposition, no visual depth beyond the main page dot grid, no showcase of what results look like. Goal: make it feel like a real commercial product without adding new backend features.

**Full audit conducted 2026-03-20. Findings:**

### Design Audit

| Issue | Severity | Location |
|-------|----------|----------|
| Main page = only a form. No hero, no value prop, no result preview | CRITICAL | `/` |
| Every page uses identical centered single-column layout — no visual rhythm | HIGH | all pages |
| Genre/game pages are text-only lists — no thumbnails, no visual depth | HIGH | `/genre`, `/genre/[slug]`, `/games/[appid]` |
| Footer has only legal links — no navigation value | MEDIUM | Footer.tsx |
| No social proof or stats visible anywhere | MEDIUM | all pages |
| CSS comment headers still say "PLAYFIT" (old brand) | LOW | globals.css, page.module.css, result/page.module.css |

### Code Audit

| Issue | Rule | Location |
|-------|------|----------|
| `formatDate()` uses hardcoded date format instead of `Intl.DateTimeFormat` | web-design-guidelines: "use Intl.DateTimeFormat" | `app/blog/page.tsx:15-18` |

All other rules (async-parallel, bundle-barrel, rerender-optimization, accessibility) — **pass**.

### Content Audit

| Item | Current | Needed |
|------|---------|--------|
| Blog posts | 3 | 5+ for AdSense credibility |
| Result preview | None visible to new visitors | Static preview on main page |
| Stats/social proof | None exposed | "82,816개 게임 분석" visible |

---

### Design Identity — "Guildeline Smell"

**Confirmed direction:** Dark terminal × gaming HUD. Phosphor lime `#c8f135` on near-black `#09090b`. Space Grotesk. Dot grid. This is distinctive and good — extend it, don't replace it.

**What Guildeline is NOT:** A game cover gallery (that's Backloggd). We don't compete on visual richness of game art.

**What Guildeline IS:** An AI taste matcher. Our visual language should say: "your play data → AI analysis → perfect match." The vocabulary of gaming — genre tags, mood descriptors — is our ambient texture.

**The "Guildeline smell":** Gaming genre/mood tags (`Souls-like`, `Open World`, `Co-op`, `Roguelike`…) scattered as ambient background text. Phosphor lime at very low opacity. This communicates "we understand game DNA" without resorting to cover art grids.

---

#### FT1 — Main Page Hero Redesign

**Goal:** Transform from "a form" into "a landing page that sells."

**Page structure (top → bottom):**
```
[Hero section — new]
  TagScatter background (decorative, aria-hidden)
  existing <h1>GUILDELINE</h1> (keep as-is — SEO anchor, C11 decision)
  <h2>: "내 플레이 기록이 곧 취향이다"  ← marketing headline, NOT h1
  <p>: "82,816개 Steam 게임 중에서 AI가 골라드립니다"
  <a href="#recommend-form">지금 시작하기 ↓</a>  ← anchor scroll to form

[Form section — existing logic unchanged]
  Add id="recommend-form" to the <form> element

[Preview section — new]
  Label: "이런 추천을 받았어요"
  2 hardcoded static result cards (real game data)
  Muted CTA: "내 추천 받기 ↑"  ← <a href="#recommend-form">

[How it works — new, 3 steps]
  1. Steam 연결 — 프로필 URL 또는 직접 입력
  2. AI 분석 — 플레이 기록 → 태그 가중치 계산
  3. 취향 게임 추천 — 예산 내 딱 맞는 게임 목록
```

**Layout change required:**
Current `.page` CSS uses `justify-content: center` (single-screen vertical centering). With multi-section structure this must change:
- Remove `justify-content: center` from `.page`
- Add `padding-top: max(6rem, 15vh)` to hero section for breathing room
- Smooth scroll: add `scroll-behavior: smooth` to `.page` under `@media (prefers-reduced-motion: no-preference)` only

**pageNav (existing fixed top-left genre/blog links):** keep as-is — still provides value on the expanded page.

**TagScatter component** (`app/components/TagScatter.tsx`):
- Client component, `aria-hidden="true"`, purely decorative
- Hardcoded ~20 gaming tags, positioned absolutely with varied opacity (0.04–0.12) and font-size (0.75rem–1.5rem)
- Tag list: `Souls-like · Open World · Co-op · Indie · RPG · Strategy · Roguelike · FPS · Sandbox · Puzzle · Horror · Simulation · Platformer · MMORPG · Card Game · Metroidvania · Visual Novel · Sports · Racing · Stealth`
- CSS animation: slow Y-drift (±8px, 8–15s, staggered per tag) — `@media (prefers-reduced-motion: reduce)` → animation: none
- Animate only `transform` and `opacity` (rules/frontend-design.md)
- Color: `var(--accent)` at varied opacity via `rgba(200, 241, 53, X)`
- Position data hardcoded (not random — SSR safe, no hydration mismatch)

**Hardcoded preview cards (2 static cards):**
```
Card 1 — Elden Ring (appid: 1245620)
  thumbnail: https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg
  reason: "오픈 월드 탐험과 고난도 전투를 좋아하는 취향에 딱 맞아요"
  price_krw: 66000 · metacritic_score: 96

Card 2 — Hades (appid: 1145360)
  thumbnail: https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg
  reason: "빠른 템포의 액션과 반복 플레이를 즐기는 취향을 반영했어요"
  price_krw: 16500 · metacritic_score: 93
```
- Use `<Image unoptimized>` (same pattern as result/page.tsx — C13 decision)
- Card layout: **separate `PreviewCard` styles written inline in `app/page.module.css`** — do NOT touch `result/page.module.css` or extract shared components. Visual output identical to result cards; code kept independent. (Rationale: result page works correctly; shared abstraction premature at 2 usage sites.)
- Cards visually identical to real result cards — shows exactly what users will see
- Label above cards: small muted uppercase "미리보기"
- No feedback buttons, no failedImages state — static display only

**How It Works — 3-step grid:**
- Simple 3-column (desktop) / stacked (mobile) layout
- Each step: number badge (accent color) + title + 1-line desc
- No icons — numbers only (consistent with terminal aesthetic)

**Files:** `app/page.tsx`, `app/page.module.css`, `app/components/TagScatter.tsx`

---

#### FT2 — Genre Index Visual Enhancement

**Current state:** Alphabetical flat chip list — 100+ genre names, all identical size, no counts.

**Goal:** A navigable content hub that communicates scale and lets users orient.

**Changes:**
- Count games per genre **by extending the existing JS loop** in `getGenres()` — same 5000-row Supabase fetch already done; add a `Map<slug, count>` accumulator in the same loop, no new query needed
- Sort by count descending (most popular first) instead of alphabetical
- Add count to each chip: `Action (1,243)` style
- Visual tier: top 12 genres (by count) → larger featured chips in a 3-col grid; remaining → smaller standard chips
- Add intro stat line: `"Guildeline이 분석한 장르 N개 · 총 82,816개 게임"` (82,816 is hardcoded — matches games_cache row count as of 2026-03-20)

**Files:** `app/genre/page.tsx`, `app/genre/page.module.css`

---

#### FT3 — Footer Enhancement

**Current:** `개인정보처리방침 · 이용약관 · © 2026 Guildeline` — navigation dead-end.

**Goal:** Light navigation value without being heavy.

**New structure:**
```
[Nav row]  홈  ·  장르별 탐색  ·  블로그
[Legal row]  개인정보처리방침  ·  이용약관
[Copy row]  © 2026 Guildeline
```

**Files:** `app/components/Footer.tsx`, `app/components/Footer.module.css`

---

#### FT4 — Blog Content (2 new posts)

**Goal:** Reach 5 posts total — baseline for AdSense reviewer trust.

**Post 4:** `steam-genre-guide-action.tsx`
- Title: `액션 게임 입문 가이드: 스팀 액션 게임 추천 10선`
- Tags: `[액션, 추천, 입문]`
- 1,000+ words, internal links to `/genre/action`, CTA to `/`

**Post 5:** `indie-games-hidden-gems.tsx`
- Title: `스팀 인디 게임 숨겨진 명작 10선`
- Tags: `[인디, 추천, 명작]`
- 1,000+ words, internal links to `/genre/indie`, CTA to `/`

**Files:** `content/blog/steam-genre-guide-action.tsx`, `content/blog/indie-games-hidden-gems.tsx`, `lib/blog.ts` (add to registry)

---

#### FT5 — Code Fixes & Brand Cleanup

Quick-win fixes, implement in one pass:

1. **`app/blog/page.tsx:15-18`** — replace `formatDate()` hardcoded format with `Intl.DateTimeFormat('ko-KR')`:
   ```ts
   function formatDate(iso: string): string {
     return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
   }
   ```
2. **`app/globals.css:1`** — `PLAYFIT — Global Styles` → `GUILDELINE — Global Styles`
3. **`app/page.module.css:1`** — `PLAYFIT — Main Page` → `GUILDELINE — Main Page`
4. **`app/result/page.module.css:1`** — `PLAYFIT — Result Page` → `GUILDELINE — Result Page`

---

#### FT6 — Home Preview Section Redesign

**Context:** FT1 added a preview section with 2 hardcoded result cards ("이런 추천을 받았어요"). Two problems: (1) cards are being clipped/cut off due to layout constraints, (2) section feels thin — only 2 cards, no visual hook for new visitors. FT6 redesigns the preview section into two distinct sub-sections.

**Design principle:** We are NOT a game cover gallery (Backloggd). We are an AI taste matcher. The thumbnail strip must feel like "AI surfaced these from your DNA" — not a browse grid. This is achieved by showing **tag chips on hover**, not just the game name. Tags = our signal.

**Migration from FT1 preview:** Remove the existing `previewCardList` JSX block (the 2 horizontal Elden Ring + Hades cards with `previewCard` / `previewThumb` / `previewCardBody` classes). Replace with the two sub-sections below. Keep `previewLabel`, `previewTitle`, and `previewCta` ("내 추천 받기 ↑") — only the card list changes.

**New preview section structure:**

```
[Preview section]  ← same .previewSection wrapper, same bg

── Sub-section A: Thumbnail Strip ─────────────────────────
Label: "미리보기"  (existing .previewLabel)
Title: "이런 추천을 받았어요"  (existing .previewTitle)

Horizontal scroll strip — 8 hardcoded games
Each tile: fixed width 220px, aspect-ratio 460/215, border-radius lg, overflow hidden
Hover/focus-visible:
  • cover image: filter blur(4px) brightness(0.4) + scale(1.04)  [transition 300ms]
  • overlay fades in (opacity 0 → 1)                             [transition 300ms]
  • overlay content: game name (bold, lg) + 3–4 tag chips below
Tag chips on hover: small pill chips, accent-dim bg, accent border, accent text
  — same "Guildeline smell" as rest of site, NOT generic white text

Links: each tile → /games/[appid]
Scrollbar: hidden (scrollbar-width: none + ::-webkit-scrollbar display:none)
Mobile: natural horizontal scroll

── Visual divider between A and B ──────────────────────────
margin-top: 3rem (no visible line — whitespace only)

── Sub-section B: Saved Games ──────────────────────────────
Label: small muted uppercase — "내 저장 목록"  (same .previewLabel style)
Title: "내가 저장한 게임"  (same .previewTitle style)
(FT6 ships this as a static shell — FT7 activates it with real data)

In FT6, always show 3 placeholder cards with a single fixed notice:
  "추천받은 게임을 저장하면 여기에 표시돼요"
  (No auth check in FT6 — same text for everyone. FT7 replaces this entire section with auth-aware logic.)
Placeholder card dimensions: same width as result cards — full width, ~120px height, centered text
```

**Hardcoded thumbnail strip games (8 total):**
```
Elden Ring      appid: 1245620  tags: Souls-like · Open World · Action RPG · Difficult
Hades           appid: 1145360  tags: Roguelike · Action · Fast-Paced · Story Rich
Stardew Valley  appid: 413150   tags: Farming Sim · Relaxing · Pixel Graphics · Indie
Hollow Knight   appid: 367520   tags: Metroidvania · Souls-like · Atmospheric · Indie
The Witcher 3   appid: 292030   tags: Open World · RPG · Story Rich · Dark Fantasy
Terraria        appid: 105600   tags: Sandbox · Crafting · Building · Exploration
Celeste         appid: 504230   tags: Platformer · Difficult · Pixel Art · Story Rich
Dead Cells      appid: 588650   tags: Roguelike · Action · Metroidvania · Fast-Paced
```
Define as a `const PREVIEW_TILES` array outside the component (not inside — no inline components rule).

**Files:** `app/page.tsx`, `app/page.module.css`

**CSS rules:**
- Tile image transition: `filter` + `transform` only (rules/frontend-design.md — no layout-triggering props)
- `prefers-reduced-motion: reduce` → transition: none on tile
- Overlay uses `position: absolute; inset: 0` — no JS, pure CSS `:hover`
- Tag chips inside overlay: `display: flex; flex-wrap: wrap; gap: 4px; justify-content: center`

---

#### FT7 — Save Recommendations Feature

**Context:** Users want to save individual game recommendations like a bookmark/cart. Logged-in only. Unlimited saves. No dedicated `/saved` page yet (planned for a later phase).

**Design principle:** Save button = "this game matched me." It's a signal of taste alignment, not just bookmarking. Keep the UI minimal — a small bookmark icon or "저장" chip. No modal, no confirmation step.

---

**Step 7-1: Supabase table**

User must run this SQL in Supabase dashboard:

```sql
create table saved_games (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  appid text not null,
  name text not null,
  reason text,
  price_krw integer,
  metacritic_score integer,
  saved_at timestamptz default now() not null,
  unique(user_id, appid)
);

alter table saved_games enable row level security;

create policy "users can manage their own saved games"
  on saved_games for all
  using (auth.uid() = user_id);
```

---

**Step 7-2: API routes**

Auth pattern (edge-runtime compatible):
- Client reads `session.access_token` from `supabase.auth.getSession()`
- Client sends `Authorization: Bearer <token>` header
- Server: `createClient(url, serviceRoleKey)` → `supabase.auth.getUser(token)` to verify identity
- Use `SUPABASE_SERVICE_ROLE_KEY` (already set as env var)

Routes:

`GET /api/saved-games`
- Verify token → get user_id
- `select * from saved_games where user_id = X order by saved_at desc`
- Returns: `{ saved: SavedGame[] }`
- 401 if no/invalid token

`POST /api/saved-games`
- Body: `{ appid, name, reason?, price_krw?, metacritic_score? }`
- Verify token → get user_id
- Upsert (unique constraint handles duplicates gracefully)
- Returns: `{ ok: true }`

`DELETE /api/saved-games/[appid]`
- Verify token → get user_id
- `delete from saved_games where user_id = X and appid = Y`
- Returns: `{ ok: true }`

All routes: `export const runtime = 'edge'`
Files: `app/api/saved-games/route.ts`, `app/api/saved-games/[appid]/route.ts`

**TypeScript type** (define in `types.ts` or inline in each file):
```ts
interface SavedGame {
  id: string
  user_id: string
  appid: string
  name: string
  reason: string | null
  price_krw: number | null
  metacritic_score: number | null
  saved_at: string
}
```

---

**Step 7-3: Result page save button** (`app/result/page.tsx`)

`result/page.tsx` currently has **no supabase client and no authState**. Add both:
```ts
// Module level (outside component):
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Inside component, add state:
const [authState, setAuthState] = useState<'loading' | 'authed' | 'anon'>('loading')
const [savedAppIds, setSavedAppIds] = useState<Set<string>>(new Set())

// useEffect — auth + saved games fetch:
useEffect(() => {
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session) { setAuthState('anon'); return }
    setAuthState('authed')
    const token = session.access_token
    const res = await fetch('/api/saved-games', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json() as { saved: SavedGame[] }
    setSavedAppIds(new Set((data.saved ?? []).map(g => g.appid)))
  })
}, [])
```

- On mount: if `authState !== 'anon'`, call `GET /api/saved-games` with Bearer token → build `Set<string>` of saved appids → `savedAppIds` state
- Each recommendation card: add save button inside the card
  - Only rendered if `authState !== 'anon'`
  - **No icon library in project — use text + Unicode only:**
    - Saved state: `"★ 저장됨"` · accent color · `background: var(--accent-dim)`
    - Unsaved state: `"☆ 저장"` · muted color · `background: var(--bg-surface)`
  - Button must NOT use transparent background (memory: feedback_no_transparent_buttons.md)
  - Click: optimistic toggle (update local Set immediately), then call POST or DELETE
  - `border: 1px solid` matching the state color · `border-radius: var(--radius)` · `padding: 4px 10px` · `font-size: 0.8125rem`

---

**Step 7-4: Home page saved games section** (`app/page.tsx`)

Activate the FT6 placeholder shell with real logic.

**Note on supabase client scope:** Currently in `page.tsx`, the supabase client is created inside the auth `useEffect`. For saved-games fetch, create a module-level constant instead:
```ts
// Move to module level (outside the component), replacing the inline createBrowserClient calls:
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```
Then both the auth useEffect and the saved-games useEffect can reference it directly.

On mount (separate useEffect, depends on `authState`):
```ts
useEffect(() => {
  if (authState === 'anon' || authState === 'loading') return
  void (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    const res = await fetch('/api/saved-games', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json() as { saved: SavedGame[] }
    setSavedGames(data.saved ?? [])
  })()
}, [authState])
```

Auth state → display:
```
authState === 'loading'    → show 3 placeholder cards (skeleton feel, no text)
authState === 'anon'       → 3 placeholder cards + "로그인하면 저장한 게임이 여기에 표시돼요"
                              + button: "로그인하기 →"
                                onClick: window.dispatchEvent(new CustomEvent('guildeline:open-login'))
                                Header.tsx must listen for this event → setShowLoginModal(true)
                                Add to Header.tsx useEffect:
                                  window.addEventListener('guildeline:open-login', () => setShowLoginModal(true))
authState !== 'anon'
  savedGames.length === 0  → 3 placeholder cards + "추천받은 게임을 저장하면 여기에 표시돼요"
                              + anchor: "지금 추천받기 ↑" → href="#recommend-form"
  savedGames.length > 0    → actual saved game cards (horizontal scroll, same tile as result cards)
                              show all saved games, newest first
                              each card: game name + reason + price/score + "저장 취소" button
```

Card style for saved games: identical to result page cards (same CSS classes if possible, or duplicate styles — no shared abstraction per FT1 precedent).

---

**Files summary:**
```
app/api/saved-games/route.ts           ← GET + POST
app/api/saved-games/[appid]/route.ts   ← DELETE
app/result/page.tsx                    ← add supabase client + authState + savedAppIds + save button
app/result/page.module.css             ← save button styles
app/page.tsx                           ← module-level supabase + activate saved section
app/page.module.css                    ← saved card styles (if new styles needed)
app/components/Header.tsx              ← add 'guildeline:open-login' custom event listener
```

---

### FT-series Implementation Order

| Step | Description | Status | Impact |
|------|-------------|--------|--------|
| FT5 | Code fixes + brand comment cleanup | ✅ done | Low |
| FT3 | Footer nav enhancement | ✅ done | Low-Medium |
| FT1 | Main page hero + TagScatter + preview cards | ✅ done | HIGH |
| FT2 | Genre index with counts + visual tiers | ⏳ next | Medium |
| FT4 | 2 new blog posts | ⏳ | Medium (AdSense) |
| FT6 | Home preview redesign: thumbnail strip + saved section shell | ⏳ | HIGH |
| FT7 | Save recommendations: DB + API + result button + home saved section | ⏳ | HIGH |

