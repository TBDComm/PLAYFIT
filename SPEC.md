# PLAYFIT — Project Specification

> Read this file before implementing any step.

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
| Game data | Steam Web API |
| Feedback storage | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |

---

## File Structure

```
playfit/
├── app/
│   ├── page.tsx               # Main page
│   ├── result/page.tsx        # Result page
│   ├── globals.css
│   └── api/
│       ├── steam/route.ts     # Steam API wrapper
│       ├── recommend/route.ts # Claude API call
│       └── feedback/route.ts  # Supabase write
├── lib/
│   ├── steam.ts               # Steam utils + sleep
│   ├── claude.ts              # Claude utils
│   └── supabase.ts            # Supabase client
├── types/
│   └── index.ts               # Shared types
└── .env.local
```

---

## Service Flow

```
1. User enters Steam profile URL + optional budget (KRW)
2. Steam API → resolve URL to SteamID64 → fetch owned games
3. Steam API → fetch store candidates → filter by budget + not owned
4. Claude API → analyze play pattern → select 5 matching games
5. Display 5 recommendation cards
6. User clicks feedback → save to Supabase
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

**3. Candidate appid source**
```
GET https://store.steampowered.com/api/featuredcategories?cc=kr&l=korean
```
- Extract appids from `new_releases` + `top_sellers`

**4. Game details**
```
GET https://store.steampowered.com/api/appdetails?appids={appid}&cc=kr&l=korean
```
- One appid per request — 200ms delay between calls (rate limit)
- Fields: `price_overview.final` (÷100 = KRW), `is_free`, `genres[].description`, `metacritic.score`, `supported_languages`
- Store URL: `https://store.steampowered.com/app/{appid}`

**Candidate filtering**
- Exclude owned appids
- If budget set: `price_krw ≤ budget`
- Exclude games with no price data
- Stop at 30 valid candidates → `NO_GAMES_IN_BUDGET` if 0 pass

---

## Claude API Specification

- **Model:** `claude-haiku-4-5` — never change
- **max_tokens:** 500
- **System prompt (exact):**
  ```
  You are a Steam game recommendation engine. Analyze the user's play history to identify their taste pattern and select 5 matching games from the candidates. Respond ONLY in valid JSON with no explanation outside the JSON.
  ```
- **User prompt (dynamic):**
  ```
  Play history (top 15 by playtime):
  [{name, playtime_hours, appid}]

  Candidate games (not owned, within budget):
  [{appid, name, price_krw, genres}]

  Rules:
  - Select exactly 5 games
  - Reason: reference the user's actual play history, 20 Korean characters max
  - Never use popularity or trending as criteria

  Response format:
  {"recommendations": [{"appid": "", "reason": ""}]}
  ```
- Always wrap in try-catch + JSON.parse defense → `AI_PARSE_FAILURE` on failure

---

## Supabase Specification

**Provide this SQL to the user to run in Supabase dashboard — do not run it yourself:**
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

Feedback route: POST `{game_id, game_name, steam_id, play_profile, rating}` → insert → 200 or 500

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

---

## MVP Scope

**In scope:**
- Steam URL input → SteamID → play history
- Budget input (KRW number, optional — empty means no limit)
- Claude API: analyze + recommend 5 games
- Game card: name, reason (≤20 chars Korean), price, rating, Korean support badge, store link
- Feedback: 3 buttons → save to Supabase
- Filter out already-owned games

**Out of scope (do not add):** accounts, saved history, social features, sorting, filtering results

---

## UI Specification

### Main page (`app/page.tsx`)
Elements in order:
1. Logo: **PLAYFIT**
2. Tagline: 나한테 맞는 게임을 찾아드립니다
3. Input: Steam profile URL — placeholder: 스팀 프로필 URL을 입력하세요
4. Input: Budget (optional) — placeholder: 예산 입력 (예: 10000) — 비우면 전체 가격대
5. Button: 내 게임 찾기
6. Loading state: 플레이 기록 분석 중...

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
STEAM_API_KEY=           ← Step 2
ANTHROPIC_API_KEY=       ← Step 5
NEXT_PUBLIC_SUPABASE_URL=      ← Step 8
NEXT_PUBLIC_SUPABASE_ANON_KEY= ← Step 8
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Steam appdetails rate limit | 200ms delay between calls, cap candidates at 30 |
| Claude JSON parse failure | try-catch + fallback `AI_PARSE_FAILURE` |
| Stale price data | Call appdetails immediately before recommendation |
| Private profile | `game_count === 0` in GetOwnedGames → `PRIVATE_PROFILE` |
