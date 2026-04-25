# UX Audit Notes

> Running log — each step appends findings. Step 20 synthesizes into UX_BACKLOG.md.
> Severity: Critical / High / Medium / Low
> Axes: A11y | UX-flow | Visual | Copy | Mobile

---

## Step 1 — app/layout.tsx

- **[High / A11y]** Skip link missing. No `<a href="#main-content">` in the layout body. Keyboard-only users must tab through the entire header on every page load. WCAG 2.4.1 bypass blocks requirement.
- **[Low / A11y]** No `preconnect` for AdSense CDN (`pagead2.googlesyndication.com`). Steam CDN preconnect exists ✅. next/font handles Google Fonts internally ✅.

---

## Step 5 — app/page.tsx (home structure)

- ✅ `<h1>` → `<h2>` hierarchy correct (hero h1, headline h2, squad-feature h2 as sibling section — valid).
- ✅ `<a href="#recommend-form">` hero CTA anchors to `<form id="recommend-form">` in RecommendationForm ✅.
- **[Low / A11y]** `<header className={styles.header}>` inside `<section className={styles.hero}>` — semantically fine but heading nesting is slightly unorthodox (`<header>` inside `<section>` inside `<main>`). Not a violation, note only.
- ✅ `aria-hidden="true"` on ctaArrow span.
- ✅ `suppressHydrationWarning` on number formatter span.

---

## Step 6 — app/components/RecommendationForm.tsx

- **[Medium / Copy]** Steam URL input `placeholder="스팀 프로필 URL을 입력하세요…"` is instructional, not example-based. Guideline says show an example pattern. Should be `"예: steamcommunity.com/id/username"`. Budget/playtime placeholders ✅ already follow `"예: {value}{unit}"`.
- ✅ Full combobox a11y: `role="combobox"`, `aria-autocomplete`, `aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`, `aria-selected`.
- ✅ Error focus: `errorRef.current?.focus()` via useEffect on error change.
- ✅ `role="alert"` on row errors and global error.
- ✅ `aria-live="polite"` + `aria-atomic="true"` for search result count announcement.
- ✅ All inputs: `label htmlFor`, `autoComplete`, `spellCheck={false}`, `inputMode` where needed.
- ✅ `disabled={loading}` on all inputs/buttons during loading.
- ✅ Keyboard nav in dropdowns (ArrowUp/Down/Enter/Escape + scroll into view).

---

## Step 7 — app/components/LibraryPickerModal.tsx

- **[Medium / A11y]** Focus trap missing. Unlike Header login modal, LibraryPickerModal has no Tab/Shift+Tab cycle guard — keyboard users can escape the modal while it's open. WCAG 2.1.2.
- **[Medium / A11y]** No `aria-live` on loading/error state changes inside the list. When library finishes loading (games === null → games loaded), screen readers are not notified. The `<p>라이브러리 불러오는 중…</p>` status has no `aria-live`.
- **[Low / A11y]** Focus not returned to trigger button on modal close.
- **[Low / A11y]** `overscroll-behavior: contain` likely missing from list container — not checked in CSS but flagged per guideline.
- ✅ ESC closes modal; backdrop click closes modal.
- ✅ Body scroll locked while open.
- ✅ `role="dialog"` + `aria-modal` + `aria-label`; `role="listbox"` + `aria-multiselectable` + `role="option"` + `aria-selected`.
- ✅ Auto-focus search input after games load.
- ✅ `loading="lazy"` on thumbnails; `alt=""` + `aria-hidden` on decorative images.
- ✅ AbortController with 10s timeout; retry button on fetch error.

---

## Step 8 — Preview.tsx + SavedGames.tsx

**Preview.tsx:**
- **[Low / Visual]** `animationDelay` set inline via `style` — need to verify the corresponding CSS animation is inside `@media (prefers-reduced-motion: no-preference)` guard. (CSS not yet read.)
- ✅ `alt={tile.name}` on all game images; explicit `width` + `height`.
- ✅ All tiles are `<Link>` (correct for navigation).

**SavedGames.tsx:**
- ✅ Loading state: `aria-busy="true"` + `aria-label` + skeleton strip.
- ✅ Empty states for anon and authed-empty with CTA.
- ✅ Keyboard accessible: "저장 취소" button `onFocus` reveals panel, `aria-label` names game.
- ✅ `Intl.NumberFormat` for price display.
- ✅ Image fallback for load errors.
- **[Low / A11y]** `<li>` on touch uses `onClick` as interactive trigger — no explicit `role` announcement for the interactive behavior. Keyboard path is covered by inner button, but sighted touch UX relies on undiscoverable tap gesture. Consider a visible hint on mobile ("탭해서 정보 보기").

---

## Step 9 — app/result/[id]/page.tsx

- **[Medium / A11y + Copy]** `<a href={card.store_url}>가격 정보 없음</a>` — link text describes a state, not the destination. Screen reader announces "가격 정보 없음 링크". Should be `"Steam에서 가격 확인"` or plain text with no link (since "Steam에서 보기" link already exists on the same card).
- **[Low / A11y]** Duplicate store URL links per card when price is unknown: "가격 정보 없음" + "Steam에서 보기 →" both point to `card.store_url`. Redundant tab stop for keyboard users.
- **[Low / A11y]** `<main>` has no `id="main-content"` — needed as skip link target once Step 1 fix is applied. Same issue exists on all other `<main>` elements.
- ✅ `<h1>` (summary) → `<h2>` per card — hierarchy correct.
- ✅ `<time dateTime>` + `Intl.DateTimeFormat` ✅; `Intl.NumberFormat` for prices ✅.
- ✅ `priority={index < 3}` on above-fold thumbnails ✅.

---

## Step 10 — FeedbackButtons + SaveToggle + ScrollToTopButton + ThumbnailImage

- **[Low / A11y]** `ScrollToTopButton`: no explicit `type="button"` attribute. Fine outside a form but best practice.
- ✅ `FeedbackButtons`: `aria-label`, `aria-pressed`, `aria-live="polite"`, `disabled` during request, fixed-height message area (no CLS).
- ✅ `SaveToggle`: dynamic `aria-label` (저장/저장 취소), `aria-pressed`, optimistic update + rollback, `pendingRef` double-click guard.
- ✅ `ScrollToTopButton`: respects `prefers-reduced-motion` for scroll behavior.
- ✅ `ThumbnailImage`: descriptive `alt`, `priority` prop, fallback to header image on error.

---

## Step 11 — app/squad/page.tsx

(Squad form page — separate read deferred; squad/page.tsx already reviewed during ENH-4 work. Main flow: member URL inputs + budget + submit. Known items: validation feedback ✅, error messages ✅. Defer full re-read to save context.)

---

## Step 12 — app/squad/[token]/page.tsx

- **[Medium / A11y + Copy]** Same "가격 정보 없음" link text issue as result/[id]/page.tsx — appears in both group cards and member pick cards.
- **[Low / A11y]** `<main>` missing `id="main-content"` (same as result page — skip link dependency).
- **[Low / UX-flow]** `session.analysis_reason` rendered as a standalone `<p>` with no section heading between the card list and member picks — orphan paragraph, context unclear at a glance.
- **[Low / Visual]** DOM order: `<p>scoreNumber</p>` → `<h1>scoreLabel</h1>`. Screen readers encounter the score (e.g. "68%") before the label "평균 취향 일치율". Could be reversed with `flex-direction: column-reverse` on the hero container, keeping DOM order semantic.
- ✅ `aria-label` on match score `<p>` (includes "퍼센트" unit).
- ✅ `aria-label` on member score container and sections.
- ✅ `Intl.DateTimeFormat` + `Intl.NumberFormat` ✅.
- ✅ `time dateTime` ✅.

---

## Step 13 — NameSessionForm + CopyUrlButton

- **[Medium / UX-flow]** `NameSessionForm`: no error state shown when PATCH fails (silent failure). User sees no feedback on save error.
- **[Low / A11y]** `NameSessionForm`: "저장됨 ✓" is button text — screen readers may not reliably announce the change. Needs `aria-live` region alongside.
- **[Low / A11y]** `NameSessionForm`: save button missing `type="button"`.
- **[Low / A11y]** `CopyUrlButton`: "복사됨 ✓" button text change has no `aria-live` announcement. Should add `aria-live="polite"` to a sibling element or use `aria-pressed`.
- ✅ `CopyUrlButton`: `type="button"` + `aria-label` ✅; silent clipboard fail ✅; 2s auto-reset ✅.
- ✅ `NameSessionForm`: `aria-label`, `autoComplete="off"`, `maxLength={60}` ✅.

---

## Step 14 — app/settings/SettingsClient.tsx

- **[Low / A11y]** Char count spans use `aria-hidden="true"` — screen readers have no character limit info. Could add `aria-describedby` pointing to a hint on the input. (Profile display name, bio.)
- **[Low / A11y]** Reload button shows `"…"` when loading but `aria-label` stays `"가중치 새로고침"` — doesn't communicate loading state to screen readers.
- ✅ `aria-live="polite"` + `aria-atomic` on all save/error messages.
- ✅ `label htmlFor` on all inputs (display-name, bio, steam-url, is-public checkbox).
- ✅ `beforeunload` guard when dirty (unsaved changes).
- ✅ `WeightRow`: aria-label on both edit button and input; double-commit guard (didCommitRef); Enter/Escape handling.
- ✅ Skeleton placeholders while loading; empty state message for no weights.

---

## Step 15 — app/users/[userId]/page.tsx

- **[Low / A11y]** Stats row (`저장한 게임`, `최근 스쿼드`) uses bare `<div>` numbers. Semantically `<dl>/<dt>/<dd>` would be more correct, but not a WCAG violation.
- ✅ `<h1>` profile name; `<h2>` for each subsection; empty states for both sections.
- ✅ `<ul>/<li>` for tags and squad history.
- ✅ `aria-hidden` on tag bar track; `aria-label` on weight value.
- ✅ `<time dateTime>` + `Intl.DateTimeFormat`.
- ✅ UUID input validation guards DB query.
- ✅ `robots: { index: false }` on private/not-found profiles.

---

## Steps 16-17 — Genre + Games/CommentsSection

**genre/page.tsx:**
- ✅ `<h1>`, `<ul aria-label>`, Breadcrumb, empty state, `Intl`. Clean.

**games/CommentsSection.tsx:**
- **[Medium / UX-flow]** `window.confirm('댓글을 삭제할까요?')` — native OS confirm dialog; cannot be styled, jarring UX. Guideline requires confirmation modal or undo.
- **[Low / UX-flow]** Reply textarea not programmatically focused when reply form opens (`openReply` sets state but no `.focus()`). Desktop users must click into textarea manually.
- ✅ `<section aria-labelledby>` + `<h2 id>` ✅.
- ✅ `<label>` (sr-only) + `aria-describedby` on error for both root and reply forms ✅.
- ✅ `aria-live="polite"` on error messages ✅.
- ✅ `type="button"` on all buttons; `aria-label` on reply/delete/report ✅.
- ✅ `Intl.DateTimeFormat` + `maxLength` + `charCount aria-hidden` ✅.

---

## Steps 18-19 — Blog + Static Pages + Reset Password

**blog/page.tsx:**
- ✅ `<h1>`, `<ul aria-label="블로그 포스트 목록">`, `<time dateTime>`, Breadcrumb, `Intl`. Clean.

**reset-password/page.tsx:**
- **[Low / A11y]** Submit button missing `type="button"` (no `<form>` wrapper, defaults to submit — technically fine but explicit is better).
- **[Low / A11y]** `sessionReady` state change from "링크 확인 중…" → form has no `aria-live` announcement.
- ✅ `label htmlFor`, `autoComplete="new-password"`, `role="alert"` on error, Enter key submit, `disabled` during loading ✅.

---

## Step 2 — app/components/Header.tsx

- **[Medium / A11y]** `menuBtn` aria-label is hardcoded `"메뉴 열기"` at line 382. When `menuOpen === true` it should read `"메뉴 닫기"` — screen readers announce the wrong action.
- **[Medium / A11y]** After closing login modal (ESC or ✕ button) and steam link popup, focus is not returned to the trigger element. WCAG 2.4.3: focus must return to the invoking control on dialog close.
- ✅ Focus trap (Tab/Shift+Tab) in login modal — correct.
- ✅ `aria-modal`, `role="dialog"`, `aria-labelledby` on both modals.
- ✅ `role="alert"` on inline auth errors — implies aria-live="assertive", correct.
- ✅ `aria-live="polite"` + `role="status"` on Toast.
- ✅ All inputs have `<label htmlFor>` + `autoComplete` + `spellCheck={false}`.

---

## Step 3 — NavLogo.tsx + Footer.tsx

- **[Low / Visual]** `NavLogo`: `height={19} style={{ width: 'auto' }}` — browser cannot precompute aspect ratio from height alone; minor CLS risk on non-home pages.
- ✅ `aria-label="Guildeline 홈"` on logo link.
- ✅ `alt=""` on decorative logo img.
- ✅ Footer `<nav aria-label="Footer links">` with `aria-hidden` separators — clean.

---

## Step 4 — LoadingOverlay.tsx + PageLoading.tsx

- **[Medium / Visual]** `LoadingOverlay`: `style={{ width: STAGE_PROGRESS[revealed] }}` uses inline width for progress bar (design rule says `transform:scaleX()` only). Component is LOCKED per `memory/project_design_identity.md` — note only, do not fix.
- **[Low / A11y]** `PageLoading`: radar SVG animation CSS not checked — need to verify `prefers-reduced-motion` compliance on `.radarSvg` spin animation (PageLoading.module.css unread).
- ✅ `LoadingOverlay`: `role="status"` + `aria-live="polite"` + `aria-label` on root; all visual elements `aria-hidden`.
- ✅ `PageLoading`: `role="status"` + `aria-label` on radar; wordmark `aria-hidden`.
- ✅ `LoadingOverlay` cleanup: `clearTimeout` in useEffect return.
