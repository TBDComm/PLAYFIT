# Improvement Backlog

> Generated: 2026-05-01 | Source: codebase audit (error handling, SEO, sharing, analytics, performance, UX, typography)
> Format: Priority tier → Category → file:line → issue + fix

---

## HIGH — Fix Soon

### Error Handling

**ERR-1 — Custom 404 page missing**
`app/not-found.tsx` — does not exist. Next.js falls back to its default 404 UI which is off-brand.
Fix: create `app/not-found.tsx`. Note: root `layout.tsx` wraps it automatically — do NOT manually import Header/Footer/NavLogo. Just export a default function with `<main id="main-content">`, on-brand copy (e.g. "404 — 페이지를 찾을 수 없어요"), and a `<Link href="/">홈으로 →</Link>`.

**ERR-2 — Global error boundary missing**
`app/error.tsx` / `app/global-error.tsx` — neither exists. Unhandled runtime errors (edge route failures, Supabase timeouts) show Next.js default crash screen.
Fix:
- `app/error.tsx`: `'use client'` component receiving `{ error: Error; reset: () => void }` props. Show friendly message + a "다시 시도" button that calls `reset()`. Root layout wraps it, so no manual Header/Footer needed.
- `app/global-error.tsx`: same pattern but MUST include its own `<html><body>` tags — it replaces the root layout entirely. Omitting these breaks the page.

### SEO

**SEO-1 — Result page metadata is static**
`app/result/[id]/page.tsx:25` — `export const metadata` is a fixed object; every result page shares the same title and description regardless of what was recommended.
Fix: replace with `export async function generateMetadata({ params }: ResultPageProps)`. Read the result from `recommendation_sets` table (same query as `getPageData` — use `React.cache()` to dedup). Build title from `rec.tags` (string[]) — e.g. `"${tags.slice(0,2).join('·')} 취향 게임 추천 ${cards.length}선 — Guildeline"`. Description: `"${tags.slice(0,3).join(', ')} 태그 기반으로 추천된 게임 목록입니다."`.

### Sharing / Virality

**SHARE-1 — Result page has no share mechanism**
`app/result/[id]/page.tsx` — users get their recommendations but have no way to share the page. The URL is shareable but there is no copy button, social link, or Web Share trigger.
Fix: create `app/result/[id]/CopyResultUrlButton.tsx` — identical pattern to `app/squad/[token]/CopyUrlButton.tsx` (same styles via `page.module.css`, same `aria-live` sr-only span). Place it in the result page footer next to `<ScrollToTopButton />`.

**SHARE-2 — Result page has no OG image**
`app/result/[id]/` — no `opengraph-image.tsx`. When someone shares a result link, the generic site OG renders instead of something result-specific.
Fix: create `app/result/[id]/opengraph-image.tsx` using `@vercel/og`. CF Pages compat for `@vercel/og` was already verified in SQ-13 — safe to use. Read `recommendation_sets` row (same cache pattern), render top 3 tags + game count on branded card. Use the same structure as `app/squad/[token]/opengraph-image.tsx` as the reference.

---

## MEDIUM — Next Iteration

### Sharing / Virality

**SHARE-3 — Squad share uses URL copy only; no Web Share API**
`app/squad/[token]/CopyUrlButton.tsx` — mobile users must copy URL manually. `navigator.share()` enables 1-tap share to KakaoTalk, iMessage, etc.
Fix: in `handleCopy`, check `navigator.share` first; fall back to clipboard if unsupported. The `aria-live` sr-only span already handles status announcement — no changes needed there.
```ts
if (navigator.share) {
  await navigator.share({ title: document.title, url: window.location.href })
} else {
  await navigator.clipboard.writeText(window.location.href)
}
```

### Analytics

**ANALYTICS-1 — GA4 event coverage is sparse**
`lib/analytics.ts` — `trackEvent(eventName: string, params?: Record<string, unknown>): void`. Only 4 events tracked: `google_login_started`, `steam_login_started`, `search_used`, `recommendation_generated`. Key funnel steps are blind.
Fix: add `trackEvent` calls at:
- `squad_created` — `app/squad/page.tsx` after `router.push` succeeds (line ~184)
- `url_copied` — `app/squad/[token]/CopyUrlButton.tsx` inside `handleCopy` after success
- `game_saved` — `app/result/[id]/SaveToggle.tsx` on successful save toggle
- `feedback_given` — `app/result/[id]/FeedbackButtons.tsx` on thumbs up/down click
- `comment_posted` — `app/games/[appid]/CommentsSection.tsx` after successful POST (inside `handlePost`, when `json.comment` is set)

### SEO

**SEO-2 — No JSON-LD on result page**
`app/result/[id]/page.tsx` — recommendation results are high-value content but have no structured data.
Fix: add `<JsonLd>` (component already exists at `app/components/JsonLd.tsx`) with `@type: "ItemList"`. Data comes from `typedCards` (already in scope). Structure:
```ts
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "스팀 취향 게임 추천",
  "numberOfItems": typedCards.length,
  "itemListElement": typedCards.map((card, i) => ({
    "@type": "ListItem", "position": i + 1, "name": card.name
  }))
}
```

**SEO-3 — No JSON-LD on squad page**
`app/squad/[token]/page.tsx` — squad result page has `generateMetadata` but no structured data.
Fix: add `<JsonLd>` with `@type: "ItemList"` using `cards` (already in scope as `SquadRecommendationCard[]`). Same structure as SEO-2. Place it alongside the other JSX at the top of the return.

### Performance

**PERF-1 — Supabase host not preconnected**
`app/layout.tsx:62` — only Steam CDN is preconnected. Browser-side Supabase calls (`createBrowserClient` in `CommentsSection`, `SaveToggle`, `Header`, `RecommendationForm`) open a cold connection on first use.
Fix: add to layout `<head>`:
```tsx
<link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
```
`crossOrigin="anonymous"` is required — Supabase API uses CORS. `NEXT_PUBLIC_SUPABASE_URL` is already public (exposed to browser), safe to render.

### UX Flow

**UX-1 — Result page has no cross-sell to Squad feature**
`app/result/[id]/page.tsx:182` — after seeing their recommendations, users hit a dead end. No mention of the squad feature which is the main differentiator.
Fix: add a compact CTA block in the `<footer>` between `footerFeedbackBox` and `ScrollToTopButton`. Style it like the existing `footerFeedbackBox` (same card, same muted palette). Copy: "친구들과 함께 즐길 게임을 찾고 싶다면?" with a `<Link href="/squad" className={styles.ctaLink}>스쿼드 추천 해보기 →</Link>`.

**UX-2 — Squad result has no "new squad" CTA**
`app/squad/[token]/page.tsx` — after viewing squad results there is no path to create another. Users must navigate back manually.
Fix: add a `<Link href="/squad">` button at the very bottom of `<main>`, after the popular multiplayer section. Copy: "새 스쿼드 만들기 →". Reuse `resultStyles.storeLink` or `styles.hostLink` for consistent styling.

---

## LOW — Polish

### Typography

**TYPO-1 — Squad score number missing tabular-nums**
`app/squad/[token]/page.module.css:58` — `.scoreHeroNumber` displays a large percentage number without `font-variant-numeric: tabular-nums`. Digits may shift width across values (e.g. "71%" vs "100%").
Fix: add `font-variant-numeric: tabular-nums` to `.scoreHeroNumber`.

**TYPO-2 — Member pill percentages missing tabular-nums**
`app/squad/[token]/page.module.css` — `.memberPill` renders `name · score%` but lacks `font-variant-numeric: tabular-nums`, causing pill widths to vary.
Fix: add `font-variant-numeric: tabular-nums` to `.memberPill`.

**TYPO-3 — Primary headings missing text-wrap: balance**
Three files have h1/h2 heading classes without `text-wrap: balance`, causing widow words on narrow viewports:
- `app/squad/[token]/page.module.css` — `.scoreHeroLabel`, `.memberPicksTitle`, `.popularTitle`
- `app/games/[appid]/page.module.css` — `.title` (h1)
- `app/settings/page.module.css` — `.sectionTitle` (h2)
Fix: add `text-wrap: balance` to each of these classes.

### SEO

**SEO-4 — User profile page has no JSON-LD**
`app/users/[userId]/page.tsx` — `generateMetadata` is in place but no structured data.
Fix: add `<JsonLd>` with `@type: "ProfilePage"`. Data already in scope: `profile.display_name`, `userId`. Structure:
```ts
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": profile.display_name ?? `유저 ${userId.slice(0, 8)}`,
  "url": `https://guildeline.com/users/${userId}`
}
```

### UX Flow

**UX-3 — Steam URL not persisted between visits**
`app/components/RecommendationForm.tsx` — users must re-enter their Steam URL on every visit. The value is not saved anywhere.
Fix: on valid Steam URL input (`STEAM_URL_REGEX` passes), write `localStorage.setItem('guildeline_steam_url', url)`. On mount, read and pre-fill — but only if `contextSteamId` is null (logged-in Steam users already get auto-fill; localStorage must not override it). Show a small label below the input: "URL이 이 기기에 저장됩니다" (appears only when pre-filled from storage).

### Performance

**PERF-2 — SavedGames list is unbounded**
`app/components/SavedGames.tsx` — saved games render as a flat horizontal list with no virtualization. Users with large libraries (100+ games) render all cards simultaneously.
Fix: add to `.savedCard` in `app/page.module.css`:
```css
content-visibility: auto;
contain-intrinsic-size: 0 120px; /* match card height */
```
No extra dependency needed. Browser skips off-screen card layout/paint while preserving scroll metrics.
