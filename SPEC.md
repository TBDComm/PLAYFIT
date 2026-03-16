# PLAYFIT — Project Specification

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
1. Logo: **PLAYFIT**
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

