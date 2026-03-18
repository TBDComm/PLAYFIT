# B8–B10 — E2E Test Checklists

Manual test procedures for all three auth paths.
Run on deployed CF Pages environment.

---

## B8 — Email Login → Link Steam → Recommend → Feedback → Return Visit

**Setup:** Have a valid Steam profile URL ready. Use a test email account.

### Step 1: Sign up or log in with email
- [ ] Visit the site — Header shows `[로그인]` button (not logged in)
- [ ] Click `[로그인]` → modal opens
- [ ] If first time: click `이메일로 로그인` → enter email+password → click `계정 만들기`
  - [ ] OTP email received → enter 6-digit code → verified
  - [ ] Modal closes, now logged in
- [ ] If returning: click `이메일로 로그인` → enter credentials → click `로그인`
  - [ ] Modal closes, now logged in
- [ ] Header shows `[로그아웃]` + `[Steam 연동]` (steam not linked)

### Step 2: Steam link popup
- [ ] After login: Steam link popup opens automatically
- [ ] Enter your Steam profile URL
- [ ] Click `연동하기`
- [ ] Popup closes; Header shows `[로그아웃]` only (no Steam link button)

### Step 3: Recommend
- [ ] Main page: Steam URL input is hidden, `내 게임 추천받기` button is visible
- [ ] (Optional) Enter a budget
- [ ] Click `내 게임 추천받기`
- [ ] Loading: `플레이 기록 분석 중...`
- [ ] 5 recommendation cards appear

### Step 4: Feedback
- [ ] Click `잘 맞아요` on one card
- [ ] Click `아니에요` on another card
- [ ] Buttons change state (visual confirmation)

### Step 5: Return visit verification
- [ ] Click `[로그아웃]` → logged out, Header shows `[로그인]`
- [ ] Click `[로그인]` → log in again with same email
- [ ] Header shows `[로그아웃]` only (Steam still linked — no `[Steam 연동]`)
- [ ] Main page: Steam URL input still hidden, `내 게임 추천받기` button still visible

### DB verification (Supabase dashboard)
- [ ] `user_profiles`: row with `steam_id` set for this user's `id`
- [ ] `user_tag_weights`: rows with `user_id` set (not null) for tags from the recommended games
- [ ] `feedback`: rows with `user_id` set for submitted feedback

---

## B9 — Steam Login → Auto Recommend → Feedback Persistence

**Setup:** Have access to the Steam account used for login.

### Step 1: Steam login
- [ ] Visit the site — Header shows `[로그인]`
- [ ] Click `[로그인]` → modal opens
- [ ] Click `Steam으로 로그인`
- [ ] Redirected to Steam OpenID login page
- [ ] Log in with Steam credentials
- [ ] Redirected back to site — now logged in
- [ ] Header shows `[로그아웃]` only (Steam already linked — no link button)
- [ ] Steam link popup does NOT appear (Steam auth = already linked)

### Step 2: Recommend
- [ ] Main page: Steam URL input is hidden, `내 게임 추천받기` button is visible
- [ ] (Optional) Enter a budget
- [ ] Click `내 게임 추천받기`
- [ ] Loading: `플레이 기록 분석 중...`
- [ ] 5 recommendation cards appear

### Step 3: Feedback
- [ ] Click `잘 맞아요` on one card
- [ ] Click `아니에요` on another card
- [ ] Buttons change state (visual confirmation)

### Step 4: Return visit — persistence check
- [ ] Click `[로그아웃]` → logged out
- [ ] Click `[로그인]` → Steam 로그인 again
- [ ] Back on main page → `내 게임 추천받기` still visible (Steam link persists)

### DB verification (Supabase dashboard)
- [ ] `user_profiles`: row with `steam_id` set for this user
- [ ] `user_tag_weights`: rows with `user_id` set (not NULL), correct tags from play history
- [ ] `feedback`: rows with `user_id` set

---

## B10 — Non-Authenticated → Full Flow → Weights Persist by steam_id

**Setup:** Use a browser with no active session (or incognito).

### Step 1: Confirm non-authenticated state
- [ ] Visit the site — Header shows `[로그인]`
- [ ] Do NOT log in

### Step 2: Recommend
- [ ] Main page: Steam URL input is visible and empty
- [ ] Enter a valid Steam profile URL
- [ ] (Optional) Enter a budget
- [ ] Click `내 게임 찾기`
- [ ] Loading: `플레이 기록 분석 중...`
- [ ] 5 recommendation cards appear

### Step 3: Feedback
- [ ] Click `잘 맞아요` on one card
- [ ] Click `아니에요` on another card
- [ ] Buttons change state (visual confirmation)

### DB verification (Supabase dashboard)
- [ ] `user_tag_weights`: rows with `steam_id` set, `user_id` IS NULL
- [ ] `feedback`: rows with `steam_id` set, `user_id` IS NULL

### Step 4: (Optional) Weights migration — log in after non-auth session
- [ ] Without clearing the Steam URL, click `[로그인]` → log in with email
- [ ] Steam link popup opens → enter same Steam URL → `연동하기`
- [ ] **DB check:** `user_tag_weights` rows that had `steam_id` set and `user_id` NULL
  should now have `user_id` set (migrated by `/api/auth/link-steam`)

---

## Pass Criteria

All three paths pass when:
- Auth state shown in Header is correct at every step
- Main page UI changes correctly per auth state (URL input hidden/shown, button text)
- Recommendations load without error
- Feedback is saved and tag weights are written to the correct key (`user_id` or `steam_id`)
- Return visit shows persisted state
