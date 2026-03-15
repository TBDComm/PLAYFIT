# SPEC Archive

Completed spec sections removed from SPEC.md.
Read only when modifying already-implemented features.

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

## Feedback → Tag Weight Update Logic [Addendum A5]

Implemented in `/api/feedback/route.ts`. Uses `tag_snapshot` (top 3 tag names) from feedback payload.

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

**B6 note:** Authentication addendum (B6) updates this logic to use `user_id` instead of `steam_id`. See Authentication [Addendum B] in SPEC.md.
