# Improvement Backlog

> Generated: 2026-05-01 | Source: codebase audit (error handling, SEO, sharing, analytics, performance, UX, typography)
> Format: Priority tier → Category → file:line → issue + fix

---

## HIGH — Fix Soon

### Error Handling

**ERR-1 — Custom 404 page missing**
`app/not-found.tsx` — does not exist. Next.js falls back to its default 404 UI which is off-brand.
Fix: create `app/not-found.tsx` with site header/footer, on-brand copy, and a link back to home.

**ERR-2 — Global error boundary missing**
`app/error.tsx` / `app/global-error.tsx` — neither exists. Unhandled runtime errors (edge route failures, Supabase timeouts) show Next.js default crash screen.
Fix: create `app/error.tsx` (client component, `"use client"`) with `error` + `reset` props; add `app/global-error.tsx` for root layout errors.

### SEO

**SEO-1 — Result page metadata is static**
`app/result/[id]/page.tsx:25` — `export const metadata` is a fixed object; every result page shares the same title and description regardless of what was recommended.
Fix: replace with `export async function generateMetadata({ params })` that reads the result row and builds a dynamic title like `"스팀 액션·RPG 취향 게임 추천 10선 — Guildeline"` using the top tags.

### Sharing / Virality

**SHARE-1 — Result page has no share mechanism**
`app/result/[id]/page.tsx` — users get their recommendations but have no way to share the page. The URL is shareable but there is no copy button, social link, or Web Share trigger.
Fix: add a `CopyResultUrlButton` (reuse `CopyUrlButton` pattern) in the result page footer alongside the scroll-to-top button.

**SHARE-2 — Result page has no OG image**
`app/result/[id]/` — no `opengraph-image.tsx`. When someone shares a result link on KakaoTalk or Twitter, it renders the generic site OG image instead of something result-specific.
Fix: create `app/result/[id]/opengraph-image.tsx` using `@vercel/og`; display top 3 tags + game count on a branded card (same pattern as `app/squad/[token]/opengraph-image.tsx`).

---

## MEDIUM — Next Iteration

### Sharing / Virality

**SHARE-3 — Squad share uses URL copy only; no Web Share API**
`app/squad/[token]/CopyUrlButton.tsx` — mobile users must copy URL manually. `navigator.share()` enables 1-tap share to KakaoTalk, iMessage, etc.
Fix: in `handleCopy`, check `navigator.share` first; fall back to clipboard if unsupported.
```ts
if (navigator.share) {
  await navigator.share({ title: document.title, url: window.location.href })
} else {
  await navigator.clipboard.writeText(window.location.href)
}
```

### Analytics

**ANALYTICS-1 — GA4 event coverage is sparse**
`lib/analytics.ts` — only 4 events tracked: `google_login_started`, `steam_login_started`, `search_used`, `recommendation_generated`. Key funnel steps are blind.
Fix: add `trackEvent` calls at:
- `squad_created` — `app/squad/page.tsx` after `router.push` succeeds
- `url_copied` — `app/squad/[token]/CopyUrlButton.tsx` after copy/share
- `game_saved` — `app/result/[id]/SaveToggle.tsx` on save
- `feedback_given` — `app/result/[id]/FeedbackButtons.tsx` on thumbs up/down
- `comment_posted` — `app/games/[appid]/CommentsSection.tsx` on successful POST

### SEO

**SEO-2 — No JSON-LD on result page**
`app/result/[id]/page.tsx` — recommendation results are high-value content but have no structured data. `ItemList` schema with game names would improve rich results.
Fix: add `<JsonLd>` with `@type: "ItemList"` listing the recommended game names (same `JsonLd` component used in `app/games/[appid]/page.tsx`).

**SEO-3 — No JSON-LD on squad page**
`app/squad/[token]/page.tsx` — squad result page has good `generateMetadata` but no structured data.
Fix: add `<JsonLd>` with a minimal `WebPage` or `ItemList` schema.

### Performance

**PERF-1 — Supabase host not preconnected**
`app/layout.tsx:62` — only Steam CDN is preconnected. Browser-side Supabase calls (`createBrowserClient` in `CommentsSection`, `SaveToggle`, `Header`, `RecommendationForm`) open a cold connection on first use.
Fix: add `<link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />` in layout `<head>`. (Value is public; safe to render.)

### UX Flow

**UX-1 — Result page has no cross-sell to Squad feature**
`app/result/[id]/page.tsx:182` — after seeing their recommendations, users hit a dead end. No mention of the squad feature which is the main differentiator.
Fix: add a compact CTA section in the footer: "친구들과 함께 즐길 게임을 찾고 싶다면? → 스쿼드 추천 해보기" linking to `/squad`.

**UX-2 — Squad result has no "new squad" CTA**
`app/squad/[token]/page.tsx` — after viewing squad results there is no path to create another. Users must navigate back manually.
Fix: add a `<Link href="/squad">` button at the bottom of the page: "새 스쿼드 만들기 →".

---

## LOW — Polish

### Typography

**TYPO-1 — Squad score number missing tabular-nums**
`app/squad/[token]/page.module.css:58` — `.scoreHeroNumber` displays a large percentage number without `font-variant-numeric: tabular-nums`. Digits may shift width across values.
Fix: add `font-variant-numeric: tabular-nums` to `.scoreHeroNumber`.

**TYPO-2 — Member pill percentages missing tabular-nums**
`app/squad/[token]/page.module.css` — `.memberPill` renders `name · score%` but lacks `font-variant-numeric: tabular-nums`, causing pill widths to vary between e.g. "71%" and "88%".
Fix: add `font-variant-numeric: tabular-nums` to `.memberPill`.

**TYPO-3 — Key headings outside home/result pages missing text-wrap: balance**
`app/squad/[token]/page.module.css`, `app/games/[appid]/page.module.css`, `app/settings/page.module.css` — `h1`/`h2` elements lack `text-wrap: balance`, causing widow words on narrow viewports.
Fix: add `text-wrap: balance` to the primary heading styles in each module.

### SEO

**SEO-4 — User profile page has no JSON-LD**
`app/users/[userId]/page.tsx` — `generateMetadata` is in place but no structured data. `ProfilePage` schema would improve discoverability of public profiles.
Fix: add `<JsonLd>` with `@type: "ProfilePage"` using `display_name` and the profile URL.

### UX Flow

**UX-3 — Steam URL not persisted between visits**
`app/components/RecommendationForm.tsx` — users must re-enter their Steam URL on every visit. The value is not remembered in `localStorage`.
Fix: on valid URL input, write to `localStorage.setItem('guildeline_steam_url', url)`. On mount, read and pre-fill if present. (Privacy note: display a clear label that the URL is stored locally only.)

**UX-4 — Popular multiplayer section lacks visual heading hierarchy**
`app/squad/[token]/page.tsx` — the popular multiplayer section below member picks renders without a section-level heading, breaking the document outline after the new `h2` additions this session.
Fix: verify the popular multiplayer section has an `<h2>` heading; add one if missing.

### Performance

**PERF-2 — SavedGames list is unbounded**
`app/components/SavedGames.tsx` — saved games render as a flat list with no virtualization. Users with large libraries (100+ games) will render all cards simultaneously.
Fix: add `content-visibility: auto` + `contain-intrinsic-size` to `.savedCard` as a lightweight alternative to a full virtual list (no extra dependency needed).
