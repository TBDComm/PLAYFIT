# PLAYFIT — Project Specification

> Read this file before implementing any step.
> Addendum sections override the original spec where they conflict.

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
│   └── api/
│       ├── steam/route.ts     # Steam API wrapper
│       ├── recommend/route.ts # Claude API call (Steam + manual mode)
│       ├── feedback/route.ts  # Supabase write + tag weight update
│       └── search/route.ts    # Autocomplete from games_cache [Addendum A7]
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

## SteamSpy API Specification

**Tag data — DB build only**
```
GET https://steamspy.com/api.php?request=appdetails&appid={appid}
```
- Response field: `tags` → `{ tag_name: vote_count }` object (e.g. `{"Souls-like": 1200, "Difficult": 980}`)
- Used **only** in `scripts/build-games-db.ts` — never called on user requests
- 200ms delay between calls in build script

---

## DB Build Script Specification [Addendum A2]

**File:** `scripts/build-games-db.ts`
**Run:** `npx tsx --env-file=.env.local scripts/build-games-db.ts`
**Trigger:** Manual only — never runs automatically. Show script to user and wait before running.

**Logic:**
1. `GET https://api.steampowered.com/ISteamApps/GetAppList/v2/` → full Steam app list (all appids + names)
2. For each appid:
   - a. `GET` Steam appdetails (name, genres) — 200ms delay between calls
   - b. `GET` SteamSpy appdetails (tags) — 200ms delay between calls
   - c. Upsert into `games_cache`
3. Skip appids already in DB with `updated_at` within 30 days → **script is resumable**
4. Log progress every 100 games
5. On any single failure: log error and skip — do not crash

**Notes:**
- First run takes several hours (Steam has ~100k apps)
- Monthly re-runs only process new or outdated entries
- `tags` column stores SteamSpy data as-is: `{ "tag_name": vote_count }`
- `genres` column stores Steam appdetails genres as `string[]`

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

**Feedback route:** POST `{game_id, game_name, steam_id, play_profile, rating, tag_snapshot}` → insert → 200 or 500

---

## Feedback → Tag Weight Update Logic [Addendum A6]

Runs inside `/api/feedback/route.ts` after every feedback submission.
Uses `tag_snapshot` (top 3 tags of the game) from the feedback payload.

**positive (잘 맞아요):**
- For each tag in `tag_snapshot`:
  `INSERT weight=1.2 ON CONFLICT UPDATE weight = LEAST(weight + 0.2, 3.0)`
- Maximum cap: `3.0`

**negative (아니에요):**
- For each tag in `tag_snapshot`:
  `INSERT weight=0.7 ON CONFLICT UPDATE weight = GREATEST(weight - 0.3, 0.1)`
- Minimum floor: `0.1`

**neutral (한번 해볼게요):**
- No weight change

---

## Manual Input Mode [Addendum A6–A9]

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

**`/api/recommend` accepts two shapes (A8):**
```typescript
{ steamUrl: string, budget?: number }                          // Steam mode (existing)
{ manualGames: [{appid, name, playtime_hours}], budget?: number } // Manual mode
```
Manual mode skips all Steam API calls. Uses `manualGames` directly as play history.
No owned games to filter. Same tag extraction + scoring + Claude logic applies.

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
- Tag-based candidate selection from DB, not real-time Steam (A3–A5)
- Feedback → tag weight update (A6)
- Manual input mode + autocomplete (A7–A9)
- End-to-end tests (A10)

**Out of scope (do not add):** accounts, saved history, social features, sorting, filtering results

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
