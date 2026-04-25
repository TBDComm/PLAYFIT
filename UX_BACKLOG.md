# UX Backlog

> Generated: 2026-04-25 | Source: UX_NOTES.md (20-step audit)
> Format: Priority tier → Axis → file:line → issue + fix

---

## HIGH — Fix Soon

### A11y

**H-1 — Skip link missing**
`app/layout.tsx:64` — No `<a href="#main-content">` in layout body. Keyboard users must tab through header on every page. WCAG 2.4.1.
Fix: add visually-hidden skip link as first child of `<body>`; add `id="main-content"` to `<main>` on all pages.

**H-2 — Focus not returned after modal close**
`app/components/Header.tsx` — ESC or ✕ close of login modal and Steam link popup does not return focus to the trigger element. WCAG 2.4.3.
Fix: store trigger ref before opening; call `triggerRef.current?.focus()` in `closeLoginModal` and `closeLinkPopup`.

---

## MEDIUM — Next Iteration

### A11y

**M-1 — Hamburger aria-label not dynamic**
`app/components/Header.tsx:382` — `aria-label="메뉴 열기"` is static; should change to `"메뉴 닫기"` when `menuOpen === true`.
Fix: `aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}`.

**M-2 — LibraryPickerModal missing focus trap**
`app/components/LibraryPickerModal.tsx` — ESC closes modal but Tab key can escape to background. WCAG 2.1.2.
Fix: add Tab/Shift+Tab trap matching the pattern in `Header.tsx` login modal.

**M-3 — LibraryPickerModal loading state not announced**
`app/components/LibraryPickerModal.tsx:131` — `<p>라이브러리 불러오는 중…</p>` has no `aria-live`. Screen readers miss the load-complete transition.
Fix: wrap list container in `<div aria-live="polite" aria-atomic="true">` or add a dedicated status element.

### UX Flow

**M-4 — NameSessionForm silent fail**
`app/squad/[token]/NameSessionForm.tsx:25` — PATCH failure has no error state. Users see no feedback if save fails.
Fix: add `error` state; show inline error message when `!res.ok`.

**M-5 — "가격 정보 없음" link text**
`app/result/[id]/page.tsx:146`, `app/squad/[token]/page.tsx:199` — Link text describes a state ("가격 정보 없음"), not the destination. Duplicate of "Steam에서 보기" link on same card.
Fix: remove the link wrapper; show "가격 정보 없음" as plain text, or replace with `"Steam에서 확인 →"` and remove the separate store link.

**M-6 — CommentsSection uses native confirm for delete**
`app/games/[appid]/CommentsSection.tsx:107` — `window.confirm(…)` is OS-native, unstyled, and visually jarring.
Fix: replace with inline confirmation (e.g. button toggles to "정말 삭제할까요?" + confirm/cancel pair).

### Copy

**M-7 — Steam URL placeholder not example-based**
`app/components/RecommendationForm.tsx:307` — `placeholder="스팀 프로필 URL을 입력하세요…"` is instructional. Guideline says show an example pattern.
Fix: `placeholder="예: steamcommunity.com/id/username"`.

---

## LOW — Polish

### A11y

**L-1 — `<main>` elements missing `id="main-content"`**
`app/result/[id]/page.tsx:85`, `app/squad/[token]/page.tsx:91`, `app/users/[userId]/page.tsx:130`, `app/settings/SettingsClient.tsx:396` — needed for skip link target (H-1 dependency).
Fix: add `id="main-content"` when H-1 is implemented.

**L-2 — CopyUrlButton and NameSessionForm status not aria-live**
`app/squad/[token]/CopyUrlButton.tsx:20`, `app/squad/[token]/NameSessionForm.tsx:50` — button text changes ("복사됨 ✓", "저장됨 ✓") not reliably announced.
Fix: add `<span aria-live="polite" aria-atomic="true" className={styles.srOnly}>{statusText}</span>` alongside each button.

**L-3 — Missing `type="button"` on several buttons**
`app/squad/[token]/NameSessionForm.tsx:45`, `app/result/[id]/ScrollToTopButton.tsx:7`, `app/reset-password/page.tsx:98` — no explicit `type` attribute.
Fix: add `type="button"` to all three.

**L-4 — Char count not accessible in Settings**
`app/settings/SettingsClient.tsx:414,436` — char count spans are `aria-hidden`; screen readers have no limit info.
Fix: add `aria-describedby` on each input pointing to a visually-hidden hint like "최대 N자".

**L-5 — Reload button loading state not announced**
`app/settings/SettingsClient.tsx:548` — `aria-label="가중치 새로고침"` static during load; `"…"` is shown visually.
Fix: `aria-label={weightsLoading ? '새로고침 중' : '가중치 새로고침'}`.

**L-6 — reset-password sessionReady transition not announced**
`app/reset-password/page.tsx:63` — "링크를 확인하는 중…" → form render has no `aria-live`.
Fix: wrap the conditional content in `<div aria-live="polite">`.

**L-7 — NavLogo image CLS risk**
`app/components/NavLogo.tsx:17` — `height={19} style={{ width: 'auto' }}` — browser can't precompute aspect ratio.
Fix: set explicit `width` from logo's natural aspect ratio, or use `style={{ height: 19, width: 'auto', aspectRatio: 'auto' }}`.

### UX Flow

**L-8 — Reply textarea not auto-focused**
`app/games/[appid]/CommentsSection.tsx:116` — `openReply` reveals inline form but doesn't move focus. Desktop users must click into textarea.
Fix: use `useRef` on the reply textarea; call `.focus()` after state update (via `useEffect` on `replyTo`).

**L-9 — Squad score DOM order (semantic vs visual)**
`app/squad/[token]/page.tsx:118` — `<p>68%</p>` precedes `<h1>평균 취향 일치율</h1>` in DOM. Screen readers encounter number before context.
Fix: reorder in DOM (h1 first, p second); use CSS `order` or `flex-direction: column-reverse` for visual layout if needed.

**L-10 — analysis_reason orphan paragraph**
`app/squad/[token]/page.tsx:239` — Claude group taste summary appears between card list and member picks with no heading.
Fix: wrap in `<section>` with `<h2>그룹 취향 요약</h2>` or `<p className={styles.sectionLabel}>`.

**L-11 — SavedGames touch gesture undiscoverable**
`app/components/SavedGames.tsx:195` — tap-to-reveal panel is the only way to see game details on touch. No visual affordance.
Fix: add a small "tap for info" hint icon or overlay on mobile (only visible on touch devices via CSS `@media (hover: none)`).

### Visual

**L-12 — Preview tile animation may lack reduced-motion guard**
`app/components/Preview.tsx:37` — `animationDelay` is set inline; CSS animation guard not verified.
Fix: check `Preview`'s CSS — wrap `@keyframes` in `@media (prefers-reduced-motion: no-preference)`.

**L-13 — LoadingOverlay progress bar uses width (LOCKED)**
`app/components/LoadingOverlay.tsx:48` — `style={{ width: STAGE_PROGRESS[revealed] }}` violates design rule (transform:scaleX only).
Note: component is LOCKED per design identity. Do not fix unless lock is lifted.
