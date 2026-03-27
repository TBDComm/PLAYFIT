# GUILDELINE Handover

> Every Claude Code session: read this file fully before doing anything.

---

📏 **File health: 166/200 lines — OK**
_Update this count on every edit. If ≥180 lines, compress before any other work (see rules/handover-rules.md §5)._

---

## ── MAINTENANCE PROTOCOL ──────────────────────────────────

| Situation | Action |
|-----------|--------|
| Starting any work | Fill In-Progress Lock immediately |
| Completing a step | Clear lock → add Completed Step entry → update Active Step |
| Non-step change (bug, config, style) | Clear lock → add Minor Changes Log entry |
| Session interrupted | Leave lock filled — next session resumes from it |
| Writing ANY text to this file | **English by default** — Korean only when genuinely necessary (Korean-specific context, UI label references). Do not default to Korean out of habit. |

Full writing rules → `rules/handover-rules.md`

---

## ── WORKSPACE CRASH PREVENTION ────────────────────────────

**NEVER `npm run build` or `npm run dev` — instant OOM crash / banned.** Use `npx tsc --noEmit` for type-check only. Testing = `git push` → Cloudflare Pages deploy → user tests in browser.

`next dev` auto-start disabled via `.idx/dev.nix`. If firebase/nixd running: `kill $(pgrep -f firebase) $(pgrep -f nixd) 2>/dev/null`. If VM crashes → RESTART workspace.

---

## ── IN-PROGRESS LOCK ──────────────────────────────────────

**Check this first. If filled, a previous session was interrupted — resume from here.**

```
STATUS: CLEAR
```

_When starting work, replace above with:_
```
STATUS: IN PROGRESS
Step: [N — name, or "non-step: description"]
Files touched: []
Stopped at: [update continuously]
Next action: [exactly what to do next to resume]
```

---

## ── CURRENT STATUS ───────────────────────────────────────

| Step | Description | Status |
|------|-------------|--------|
| 1–10, A1–A10 | MVP + Supabase + Claude tags (A7-1 removed: Steam API empty server-side) | ✅ 2026-03-13–16 |
| B1–B10 | Auth: Google OAuth, Steam OpenID, email+pw, link-steam migration, E2E tests | ✅ 2026-03-16 |
| C1–C13 | SEO, legal, GA4, architecture, game/genre/blog pages, AdSense, Schema, CWV | ✅ 2026-03-18–20 |
| FT1–FT7 | Preview strip, genre/blog UX, save system (saved_games table + API + UI) | ✅ 2026-03-21–23 |

**Env vars:** STEAM_API_KEY ✅ · ANTHROPIC_API_KEY ✅ · NEXT_PUBLIC_SUPABASE_URL ✅ · NEXT_PUBLIC_SUPABASE_ANON_KEY ✅ · NEXT_PUBLIC_BASE_URL ✅ · SUPABASE_SERVICE_ROLE_KEY ✅ · NEXT_PUBLIC_GOOGLE_CLIENT_ID ✅ · NEXT_PUBLIC_GA_MEASUREMENT_ID ✅ · NEXT_PUBLIC_ADSENSE_CLIENT_ID ⏳ (pending AdSense approval — add to CF Pages when Publisher ID received)

**Supabase tables:** `feedback` ✅ · `games_cache` ✅ (82,816 rows) · `user_tag_weights` ✅ · `user_profiles` ✅ · `saved_games` ✅

---

## ── ACTIVE STEP: S1 — Home Page Polish ────

**S-series: site-wide polish toward backlogged.com quality level.**
S1 = home page UX overhaul. Full spec below — do NOT read SPEC.md.

### S1 Spec (implement in order)

**1. Remove "How it works" section**
- Delete `.howSection` JSX block (app/page.tsx)
- Delete all how* CSS classes (app/page.module.css)

**2. Hero entrance animation (CSS only)**
- `@keyframes heroFadeUp`: `opacity 0→1, translateY(-10px)→0`
- Apply to (actual CSS class names in `page.module.css`):
  - `.logo` (0ms), `.headline` (80ms), `.heroStat` (140ms), `.heroCta` (200ms)
  - Note: `.tagline` class exists in CSS but is unused in JSX — use `.headline` for the `<h2>`
- TagScatter wrapper: opacity-only fade, 100ms delay
  - In `app/page.tsx`: wrap `<TagScatter />` with `<div className={styles.tagScatterWrap}>`
  - In `app/page.module.css`: add `.tagScatterWrap { animation: opacityIn 0.8s ease both 100ms }` under no-preference gate
  - `@keyframes opacityIn { from { opacity: 0 } to { opacity: 1 } }` (separate from heroFadeUp — no translateY)
- Gate all above: `@media (prefers-reduced-motion: no-preference)` only

**3. Stat counter animation**
- "82,816" counts up from 0 on mount via `useEffect` + `requestAnimationFrame`
- Duration: 1200ms, ease-out curve
- Disable under `prefers-reduced-motion: reduce`
- Display value formatted with `Intl.NumberFormat('ko-KR')`

**4. Scroll-triggered section reveals**
- IntersectionObserver (threshold 0.08, rootMargin `0px 0px -32px 0px`)
- Refs: `const formRevealRef = useRef<HTMLElement>(null)`, `const previewRevealRef = useRef<HTMLElement>(null)`
- Place `ref={formRevealRef}` on `<section className={styles.formSection}>`, `ref={previewRevealRef}` on `<section className={styles.previewSection}>`
- State: `formRevealed`, `previewRevealed` (boolean). When true, append CSS class to the section:
  - `formSectionRevealed` on the formSection, `previewSectionRevealed` on the previewSection
- CSS: under `@media (prefers-reduced-motion: no-preference)`:
  - `.formSection`, `.previewSection` start: `opacity: 0; transform: translateY(16px); transition: opacity 0.55s ease, transform 0.55s ease`
  - `.formSectionRevealed`, `.previewSectionRevealed`: `opacity: 1; transform: none`
- unobserve each target immediately after first intersection (reveal is one-time)

**5. Preview tiles stagger on reveal**
- When `previewRevealed` becomes true, each tile `<Link>` gets `style={previewRevealed ? { animationDelay: \`${idx * 28}ms\` } : undefined}`
- CSS trigger (under no-preference gate): `.previewSectionRevealed .previewTile { animation: tileFadeUp 0.5s ease both }`
- `@keyframes tileFadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }`

**6. Form input focus glow + label activation**
- Focus glow: ALREADY implemented in `.input:focus-visible` (page.module.css) — do NOT add again
- Label accent (NEW — add to page.module.css):
  - Add `transition: color 0.15s ease` to `.label`
  - `.inputWrapper:has(.input:focus) .label, .inputWrapper:has(.input:not(:placeholder-shown)) .label { color: var(--accent) }`

**7. Steam URL inline validation (no API call)**
- New state: `const [urlValid, setUrlValid] = useState(false)`
- In steam URL `<input>` onChange: `setUrlValid(/steamcommunity\.com\/(id|profiles)\//.test(e.target.value))`
- Wrap the steam `<input>` in `<div className={styles.urlInputWrap}>` (position: relative)
- Inside wrapper after `<input>`: `{urlValid && <span className={styles.urlValidIcon} aria-hidden="true">✓</span>}`
- CSS: `.urlInputWrap { position: relative }` · `.urlValidIcon { position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); color: var(--accent); font-size: 0.875rem; pointer-events: none }`
- Input is already inside `mode === 'steam'` block — no extra mode check needed on the icon

**8. Loading button pulse animation**
- Submit button className: `\`${styles.button}${loading ? \` ${styles.buttonLoading}\` : ''}\``
- CSS (under no-preference gate): `@keyframes loadingPulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.65 } }`
- `.buttonLoading { animation: loadingPulse 1.4s ease-in-out infinite }`
- Also add to `@media (prefers-reduced-motion: reduce)` block: `.buttonLoading { animation: none }`

**9. TagScatter opacity boost**
- In `app/components/TagScatter.tsx`, multiply each `opacity` value × 1.6, round to 2 dp
- Full mapping: 0.04→0.07, 0.05→0.08, 0.06→0.10, 0.07→0.11, 0.08→0.13, 0.09→0.14, 0.10→0.16

### S1 Files
- `app/page.tsx`
- `app/page.module.css`
- `app/components/TagScatter.tsx`

### S1 Constraints
- Only animate `transform` + `opacity`
- No `transition: all`
- No external animation libraries
- tsc must pass before commit

---

## ── MINOR CHANGES LOG ────────────────────────────────────

_2026-03-21 to 2026-03-27 entries → HANDOVER-archive.md §Minor Changes Log_

---

## ── COMPLETED STEPS ──────────────────────────────────────

- B1 through B10 archived → see HANDOVER-archive.md

---

## ── PROJECT REFERENCE ────────────────────────────────────

Completed step detail → `HANDOVER-archive.md`
AdSense activation steps (post FT-series) → `HANDOVER-archive.md §AdSense Activation Checklist`
Full spec (pending steps only) → `SPEC.md` — read only when starting a new step, relevant section only
Completed spec detail → `SPEC_archive.md`
