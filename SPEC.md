# GUILDELINE — Project Specification

All prior phases complete (A1–A10, B1–B10, C1–C13, FT1–FT7, S1–S5).

**Full prior spec detail** → `SPEC_archive.md` (read only when modifying existing features).

---

## Phase CE — Completeness & Experience (CE-1 through CE-15)

Source: Full UX simulation 2026-03-28. All issues confirmed in code — file:line cited per step.

**Execution order:** CE-1 → CE-15 in sequence. CE-7 is resolved by CE-4 (no separate work needed).

---

### CE-1 — Mobile: Saved Games touch panel

**Problem:** `SavedGames.tsx:65-100` — Floating detail panel activates on `mouseenter` only. Touch users cannot see game details (reason, price, Metacritic) or unsave.

**Files:** `app/components/SavedGames.tsx`, `app/page.module.css`

**Spec:**
- Detect pointer type on card interaction: if `event.pointerType === 'touch'` (or use `onTouchStart`) → use tap-toggle behavior instead of hover
- On tap: open panel (same `handleCardEnter` logic). Panel stays open until: tap outside, tap another card, or tap "저장 취소"
- Add transparent backdrop `<div>` (position fixed, inset 0, z below panel) when panel is open on touch → `onClick` dismisses panel
- Desktop (`pointerType === 'mouse'`): existing hover behavior unchanged
- Add `aria-expanded` on each card toggled by touch state

**Out of scope:** Redesigning panel layout for mobile.

---

### CE-2 — Library picker: show for unlinked_auth users with valid URL

**Problem:** `RecommendationForm.tsx:243` — `canUsePicker` excludes `authState === 'unlinked_auth'`. Logged-in users who manually enter a valid Steam profiles URL cannot use the picker even though `steamId` is parseable.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Change line 243 from:
  ```tsx
  const canUsePicker = (authState === 'steam' || authState === 'linked') && steamId !== null
  ```
  to:
  ```tsx
  const canUsePicker = authState !== 'anon' && authState !== 'loading' && steamId !== null
  ```

**Out of scope:** Changing picker behavior itself.

---

### CE-3 — Library picker: fetch timeout + retry button

**Problem:** `LibraryPickerModal.tsx:31-39` — library fetch has no timeout. API stall = modal stuck in "불러오는 중…" forever. No retry mechanism.

**Files:** `app/components/LibraryPickerModal.tsx`

**Spec:**
- Wrap fetch with `AbortController`, abort after 10 000ms
- On timeout or network error: set error state → show existing "라이브러리를 불러올 수 없어요" message + add "다시 시도" button below
- "다시 시도" click: reset error state + loading true + re-run the same fetch (re-create controller)
- Cleanup: `abort()` the controller on modal unmount

**Out of scope:** Changing library display or selection logic.

---

### CE-4 — Feedback buttons: allow vote change + show error on failure

**Problem 1:** `result/[id]/FeedbackButtons.tsx:54` — after any vote, both buttons disabled permanently in session. No vote change possible.
**Problem 2:** API failure silently disables buttons — user has no idea if vote was recorded.

**Files:** `app/result/[id]/FeedbackButtons.tsx`

**Spec:**
- State: `feedback: 'up' | 'down' | null` (existing), `sending: boolean`, `error: string | null`
- After successful vote: buttons remain **enabled**. Selected button gets visual "active" class (accent border/bg). Clicking the other button sends a new vote (API upserts — idempotent).
- Clicking already-selected button: no-op
- On API failure: set `error = '저장 실패. 다시 시도해주세요'`, show below buttons, re-enable buttons, revert `feedback` state to previous
- Loading (sending): disable both buttons + reduce opacity to 0.5
- This resolves CE-7 (silent failure) — no separate CE-7 step needed

**Out of scope:** Changing feedback API route logic.

---

### CE-5 — Result page: save toggle on each recommendation card

**Problem:** `result/[id]/page.tsx` — no save action on result cards. Users must navigate back to home to use Saved Games section.

**Files:** `app/result/[id]/page.tsx`, `app/result/[id]/page.module.css`

**Spec:**
- Create `SaveToggle` client component (`app/result/[id]/SaveToggle.tsx`):
  - Props: `appid: string`, `name: string`, `reason?: string`, `price_krw?: number | null`, `metacritic_score?: number | null`
  - On mount: `supabase.auth.getSession()` → if authed, fetch `/api/saved-games` (GET) → check if this appid is saved → set initial state
  - ★ (saved) / ☆ (not saved) toggle button, top-right of card, `position: absolute`
  - Click when not authed: `window.dispatchEvent(new CustomEvent('guildeline:open-login'))`
  - Click when authed: optimistic toggle + POST or DELETE `/api/saved-games`
  - Reuse `createBrowserClient` from `@supabase/ssr` (module scope, not inside component)
- In `result/[id]/page.tsx`: wrap card with `position: relative`, render `<SaveToggle>` inside each card
- Style: `font-size: 1.125rem`, accent color when saved, `--text-muted` when not saved, `padding: 0.375rem`, `border-radius: var(--radius)`, hover background `var(--bg-hover)`

**Out of scope:** Syncing save state with SavedGames home section in real-time.

---

### CE-6 — Steam link popup: remove auto-trigger, add benefit copy

**Problem:** `Header.tsx:118-119` — Steam link popup fires immediately after Google login before user sees home page. No explanation of benefits anywhere near the button.

**Files:** `app/components/Header.tsx`, `app/components/Header.module.css`

**Spec:**
- Remove the auto-popup on login: delete/comment out the `if (!steamLinked) setShowLinkPopup(true)` call (or equivalent) that fires in the `SIGNED_IN` handler
- In the header dropdown, above the "Steam 연동하기" button: add `<p>` with copy: `"연동하면 플레이 기록 자동 분석 + 라이브러리 직접 선택"`
- Style for new copy: `font-size: 0.75rem`, `color: var(--text-muted)`, `margin-bottom: 0.375rem`
- The "Steam 연동하기" button and its modal remain fully functional — only the auto-trigger is removed

**Out of scope:** Changing the link modal or settings page.

---

### CE-7 — (Resolved by CE-4)

CE-4 covers silent failure feedback handling. No separate work.

---

### CE-8 — /games/[appid]: back navigation

**Problem:** `games/[appid]/page.tsx` — no back button. Mobile users rely entirely on browser gestures.

**Files:** `app/games/[appid]/page.tsx`, `app/games/[appid]/page.module.css`

**Spec:**
- Add `<Link href="/">← 홈으로</Link>` at the top of the page, above the hero section
- Style: same as result page "← 다시 추천받기" pattern — `font-size: 0.875rem`, `color: var(--text-muted)`, hover → `var(--accent)`, `text-decoration: none`
- Place inside the existing page container, before the hero `<section>`

**Out of scope:** Implementing browser-history-aware back (router.back()) — static Link to `/` is sufficient.

---

### CE-9 — /genre page: add recommendation CTA at bottom

**Problem:** `genre/page.tsx` — genre browsing ends with no next action. No path to the recommender.

**Files:** `app/genre/page.tsx`, `app/genre/page.module.css` (if needed)

**Spec:**
- Add a CTA block at the bottom of the genre list page (after the full genre list)
- Heading: `"내 취향에 맞는 게임을 추천받아보세요"`
- Link: `<Link href="/#recommend-form">추천 받기 →</Link>`
- Style: reuse `previewCta` pattern from `page.module.css` or add equivalent local class; centered, muted text with accent hover

**Out of scope:** Adding CTAs to individual `/genre/[slug]` pages.

---

### CE-10 — Remove "커뮤니티 기능 곧 출시" placeholder

**Problem:** `games/[appid]/page.tsx:362-365` — "커뮤니티 기능은 곧 출시됩니다" section signals incompleteness to users.

**Files:** `app/games/[appid]/page.tsx`, `app/games/[appid]/page.module.css`

**Spec:**
- Delete the community section JSX block entirely
- Remove corresponding CSS class(es) if they become unused after deletion

**Out of scope:** Implementing community features.

---

### CE-11 — Anon Steam URL mode: add "feedback won't save" notice

**Problem:** `RecommendationForm.tsx:351-352` — "피드백이 저장되지 않아요" notice only shown in manual mode. Anonymous users submitting via Steam URL get no such warning.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- In the Steam URL input block (the `mode === 'steam'` branch that is NOT `authState === 'steam'`):
  - When `authState === 'anon'` or `authState === 'unlinked_auth'`: render `<p className={styles.manualNotice}>스팀 계정 없이는 피드백이 저장되지 않아요.</p>` below the URL input
- Reuse existing `styles.manualNotice` class — no new CSS needed

**Out of scope:** Changing the manual mode notice.

---

### CE-12 — Unify submit button text

**Problem:** `RecommendationForm.tsx:374-378` — "내 게임 찾기" (anon) vs "내 게임 추천받기" (Steam-linked). Same function, different copy creates inconsistent expectations.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Replace ternary `authState === 'steam' ? '내 게임 추천받기' : '내 게임 찾기'` with single string: `'게임 추천받기'`
- Loading state text `'취향 분석 중…'` unchanged

**Out of scope:** Changing any other copy in the form.

---

### CE-13 — Saved games: image load failure fallback

**Problem:** `SavedGames.tsx:158-167` — `onError` hides the image but leaves an empty card. Game name not shown as fallback.

**Files:** `app/components/SavedGames.tsx`, `app/page.module.css`

**Spec:**
- When `failedSavedImages.has(game.appid)`: render `<div className={styles.savedCardFallback}>` instead of `<Image>`
  - Show `<span>{game.name}</span>` centered in the card
- Add `.savedCardFallback` CSS: `width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 0.5rem; text-align: center; font-size: 0.6875rem; color: var(--text-muted); line-height: 1.4;`
- The `.savedCardOverlay` (game name gradient) should remain visible at full opacity for fallback cards — add `.savedCardFallback ~ .savedCardOverlay { opacity: 1; }` or apply a modifier class

**Out of scope:** Retrying failed image loads.

---

### CE-14 — Result cards: reduce animation stagger delay

**Problem:** `result/[id]/page.module.css:103-105` — `calc(var(--animation-order, 0) * 80ms)`. Card 10 appears 800ms after card 1. Feels sluggish.

**Files:** `app/result/[id]/page.module.css`

**Spec:**
- Change multiplier from `80ms` to `40ms`
- Single line change only

**Out of scope:** Changing animation type, duration, or easing.

---

### CE-15 — Steam linking: add value proposition copy in dropdown

**Problem:** `Header.tsx:379-385` — "Steam 연동하기" button in dropdown has no context. Users don't know what they gain from linking.

**Files:** `app/components/Header.tsx`, `app/components/Header.module.css`

**Spec:**
- In the header dropdown, directly above the "Steam 연동하기" button: insert `<p>` with copy: `"연동하면 플레이 기록 자동 분석 + 라이브러리 직접 선택"`
- Style: `font-size: 0.6875rem`, `color: var(--text-muted)`, `margin-bottom: 0.375rem`, `line-height: 1.4`
- No new CSS class needed if inline style or existing class fits — otherwise add `.steamLinkHint` to `Header.module.css`

**Out of scope:** Changing the link modal or settings page copy.
