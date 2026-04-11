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

### CE-16 — Skeleton UI on page transitions

**Background:** Currently `app/loading.tsx` shows a full-page centered loading screen (wordmark + radar + phosphor scan). Skeleton UI shows the page layout with placeholder shapes before content loads — reduces perceived wait time and lets users see structure immediately.

**Scope:**
- Replace `app/loading.tsx` full-page approach with per-page skeleton layouts
- Pages: `/` (home), `/genre`, `/blog`, `/games/[appid]`
- The phosphor scan gauge moves to a fixed top bar (NProgress style) over the skeleton, or is removed
- `PageLoading` component retired or repurposed

**Decision deferred:** CE-series must be complete first. Skeleton per page is significant scope.

---

### CE-15 — Steam linking: add value proposition copy in dropdown

**Problem:** `Header.tsx:379-385` — "Steam 연동하기" button in dropdown has no context. Users don't know what they gain from linking.

**Files:** `app/components/Header.tsx`, `app/components/Header.module.css`

**Spec:**
- In the header dropdown, directly above the "Steam 연동하기" button: insert `<p>` with copy: `"연동하면 플레이 기록 자동 분석 + 라이브러리 직접 선택"`
- Style: `font-size: 0.6875rem`, `color: var(--text-muted)`, `margin-bottom: 0.375rem`, `line-height: 1.4`
- No new CSS class needed if inline style or existing class fits — otherwise add `.steamLinkHint` to `Header.module.css`

**Out of scope:** Changing the link modal or settings page copy.

---

### CE-17 — SaveToggle: error message disappears before user notices

**Problem:** `app/result/[id]/SaveToggle.tsx` — save failure error clears via `setTimeout(..., 2000)`. If user is scrolling or not watching, they miss it and assume save succeeded.

**Files:** `app/result/[id]/SaveToggle.tsx`

**Spec:**
- Remove the `setTimeout` that clears `errorMsg`
- Instead, clear `errorMsg` at the start of the next save attempt (before the fetch)
- Result: error stays visible until the user tries again

**Out of scope:** Changing success state behavior; adding toast infrastructure.

---

### CE-18 — (Resolved — LibraryPickerModal already has sticky footer layout)

Modal already has `display: flex; flex-direction: column`, list `flex: 1; overflow-y: auto`, footer `flex-shrink: 0`. No action needed.

---

### CE-19 — Header login modal: no focus trap

**Problem:** `app/components/Header.tsx` — login modal has no focus trap. Pressing Tab from the last field lets focus escape to the page behind the modal.

**Files:** `app/components/Header.tsx`

**Spec:**
- On `keydown` inside the modal overlay, intercept Tab and Shift+Tab
- Collect all focusable elements inside the modal (inputs, buttons, links) via querySelectorAll
- If Tab on last element → focus first element; if Shift+Tab on first element → focus last element
- Attach listener when modal opens, remove when modal closes
- Use the existing modal ref or add one to the modal container div

**Out of scope:** Changing modal layout, adding skip links, or implementing a shared FocusTrap component.

---

### CE-20 — (Resolved — Header.tsx:673-675 already has back button for forgot-sent view)

`← 로그인으로` button already rendered for `verify | forgot | forgot-sent` states. No action needed.

---

### CE-21 — RecommendationForm: game search API failure is silent

**Problem:** `app/components/RecommendationForm.tsx` — the autocomplete search `catch` block is empty. If `/api/search` fails (network error, timeout), the dropdown simply never appears and the user has no idea why.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- In the catch block of the game search fetch, set a local error state per row (or a shared `searchError` state)
- Show a small inline message below the input: `"게임 검색에 실패했어요. 잠시 후 다시 시도해주세요."` using existing `styles.fieldError` or similar class
- Clear the error when user starts typing again (on next input change)

**Out of scope:** Retry logic, caching search results.

---

### CE-22 — SavedGames: keyboard focus immediately closes panel

**Problem:** `app/components/SavedGames.tsx` — `onFocus` on the save card opens the panel; `onBlur` closes it. When a keyboard user focuses the card, the panel opens and immediately closes because focus moves to the keyboard-only unsave button inside the panel (triggering blur on the card).

**Files:** `app/components/SavedGames.tsx`

**Spec:**
- In the `onBlur` handler, check `event.relatedTarget` — if the related target is contained within the same card/panel element, do NOT close the panel
- Use `cardRef.current?.contains(event.relatedTarget as Node)` to determine if focus stayed inside

**Out of scope:** Changing mouse hover behavior or panel layout.

---

### CE-23 — SavedGames: skeleton loading has no accessible label

**Problem:** `app/components/SavedGames.tsx` — loading skeleton shows 4 placeholder cards with no text. Screen readers get no feedback; sighted users can't distinguish loading from empty.

**Files:** `app/components/SavedGames.tsx`

**Spec:**
- Wrap skeleton cards in a container with `aria-label="저장한 게임 불러오는 중"` and `aria-busy="true"`
- Add a visually-hidden `<span>` (CSS `sr-only` pattern) with text `"저장한 게임을 불러오는 중입니다"` above the skeleton cards
- Reuse or add `.srOnly` class: `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0)`

**Out of scope:** Changing skeleton card visual design.

---

### CE-24 — LibraryPickerModal: game row button touch target below 44px

**Problem:** `app/components/LibraryPickerModal.module.css` — `.gameRow` has `padding: 0.4rem 1rem` giving ~30px row height, below the 44px touch target minimum. (Checkbox symbol ☑/☐ already has `aria-hidden="true"` — accessibility is correct, only touch target needs fixing.)

**Files:** `app/components/LibraryPickerModal.module.css`

**Spec:**
- Add `min-height: 44px` to `.gameRow`

**Out of scope:** Replacing unicode checkbox symbol; changing selection logic.

---

### CE-25 — (Resolved — Header.tsx:353 already has aria-label="메뉴 열기")

No action needed.

---

### CE-26 — RecommendationForm: submit button enables on any URL text

**Problem:** `app/components/RecommendationForm.tsx:230` — `canSubmit` for steam mode uses `!!url.trim()`, not `urlValid`. The submit button activates as soon as any text is typed (e.g., "abc"), and the user only discovers the URL is invalid after clicking submit.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Change steam-mode branch of `canSubmit` from `!!url.trim()` to `urlValid`
- Result: `const canSubmit = mode === 'steam' ? urlValid : manualGames.some(...)`
- For `authState === 'steam'`, the URL is set programmatically from `contextSteamId` and will always be valid — no regression.

**Out of scope:** Changing the ✓ icon, URL validation logic, or error message copy.

---

### CE-27 — RecommendationForm: focus not moved to error on submit failure

**Problem:** `app/components/RecommendationForm.tsx:383` — after a submit error, focus stays on the submit button. Keyboard users may not see the error message at the bottom. `web-design-guidelines.md` requires: "focus the first error on submit".

**Context:** `setError` is called in multiple places — `handleSubmit` directly (lines 187, 213, 222) AND inside `callApi` (lines 170–173). Patching only `handleSubmit` would miss the most common error path (API returning an error code). Use `useEffect` to catch all cases.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Add `const errorRef = useRef<HTMLParagraphElement>(null)`
- Add a `useEffect` that fires when `error` transitions from `null` to a non-null string:
  ```ts
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  ```
- Add `ref={errorRef}` and `tabIndex={-1}` to the error `<p>` at line 383
- `tabIndex={-1}` makes the element programmatically focusable without adding it to tab order

**Out of scope:** Changing error styling or inline row errors.

---

### CE-28 — RecommendationForm: manual mode submit blocked with no explanation

**Problem:** `app/components/RecommendationForm.tsx:231` — in manual mode, the submit button is disabled if any filled game row is missing playtime. The user sees the button is greyed out but has no indication why.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Below the manual game rows (after the `</div>` closing `manualRows`), show a conditional hint:
  - Condition: `mode === 'manual' && !canSubmit && manualGames.some(g => g.name.trim() && g.appid !== null)`
  - Text: `"이름과 플레이 시간을 모두 입력해야 추천받을 수 있어요"`
  - Use existing `styles.manualNotice` class

**Out of scope:** Changing canSubmit logic or row-level validation.

---

### CE-29 — RecommendationForm: linked Steam account not identified

**Problem:** `app/components/RecommendationForm.tsx:271–277` — when `authState === 'steam'`, only "Steam 계정이 연동되어 있어요" is shown. The user cannot verify which account is connected without leaving the page.

**Context:** In this code path, `steamId` (line 235) holds the numeric Steam ID extracted from `url`, which is populated from `contextSteamId` via the `useEffect` at line 55–57. `steamId` will always be non-null when `authState === 'steam'`.

**Files:** `app/components/RecommendationForm.tsx`, `app/page.module.css`

**Spec:**
- In the steam-linked block (line 273), add a link after the `.manualNotice` `<p>`:
  ```tsx
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.steamAccountLink}
  >
    연동 계정 ID: {steamId}
  </a>
  ```
  - Show the numeric `steamId` only (not the full URL) — short, no overflow risk
- Add `.steamAccountLink` to `page.module.css`:
  ```css
  .steamAccountLink {
    margin-top: 0.375rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .steamAccountLink:hover { color: var(--accent); }
  ```

**Out of scope:** Fetching Steam username or avatar, changing the layout.

---

### CE-30 — RecommendationForm: budget placeholder text is redundant

**Problem:** `app/components/RecommendationForm.tsx:362` — the budget input has label "예산 (선택)" and placeholder "예산 입력 (예: 10000)…". "예산 입력" duplicates the label text and adds noise.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Change placeholder from `"예산 입력 (예: 10000)…"` to `"예: 20000"`

**Out of scope:** Changing the label, input type, or any other copy.

---

### CE-31 — RecommendationForm: search result count not announced to screen readers

**Problem:** `app/components/RecommendationForm.tsx:323` — when the game search dropdown appears, screen reader users receive no announcement of how many results are available. The `aria-expanded` attribute updates correctly, but no count or summary is announced.

**Context:** `fetchSearch` (line 96–103) is the single function that sets dropdown results. Setting the live text there is the cleanest approach — avoids a `useEffect` on all 5 dropdowns and makes it clear which row triggered the announcement.

**Files:** `app/components/RecommendationForm.tsx`

**Spec:**
- Add `const [searchLiveText, setSearchLiveText] = useState('')`
- In `fetchSearch`, after `setDropdowns(...)`:
  ```ts
  setSearchLiveText(data.length > 0 ? `게임 ${data.length}개 검색됨` : '검색 결과 없음')
  ```
- Clear on next search start: in `handleNameChange`, before `fetchSearch` is scheduled, add `setSearchLiveText('')`
- Render once inside `<form>`, outside the `.map()`:
  ```tsx
  <span className={styles.srOnly} aria-live="polite" aria-atomic="true">{searchLiveText}</span>
  ```
- `.srOnly` is already defined in `page.module.css:7–17`

**Out of scope:** Changing dropdown visual design or keyboard navigation.
