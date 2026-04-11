# CF Pages + React Gotchas

Hard-won lessons that bit us once. Read only when debugging a CF Pages build failure, an edge runtime error, or a React ref/effect bug. For everyday rules, stay in CLAUDE.md §Coding Rules.

---

## Cloudflare Pages + Edge Runtime

- **`req.nextUrl` returns null on CF Workers.** Always use `new URL(req.url).searchParams` in edge routes. This has broken production at least once.
- **Every `[param]` route needs `export const runtime = 'edge'`.** Node runtime breaks the CF Pages build for dynamic routes.
- **`runtime = 'edge'` + `generateStaticParams` = build error** — they are mutually exclusive. Use `export const dynamic = 'force-dynamic'` instead.
- **CF Workers free plan: 50 subrequests/invocation hard limit.** Count *every* outbound `fetch()` — Supabase, Steam, Claude, fire-and-forget `upsert*` calls. Keep the total under 40 to leave headroom. Cap cache-miss fetches with `.slice(0, N)` where N is chosen from the budget.
- **Favicons/icons must live in `public/`**, referenced via `metadata.icons` in `layout.tsx`. Placing them inside `app/` creates dynamic metadata routes that break the CF Pages build.

---

## React Refs + Effects

- **No early return with `useEffect([], ...)` refs.** Components with ref-dependent effects must render full JSX on every render. If you early-return a loading state, the ref is null when the effect fires — the effect silently does nothing. Use a `position: fixed` overlay for the loading state instead so the underlying ref-bearing JSX stays mounted.

---

## CSS + Buttons

- **No transparent button backgrounds.** All buttons — including ghost/outline variants — need `var(--bg-elevated)` or another solid background. Text-link buttons need padding + border to make the background visible. Without this, focus rings have nothing to contrast against.

---

## Image Handling

- **NEVER embed base64 image data in TSX/JS files.** Base64 in code = massive token cost on every Read of that file. Put images in `public/` and reference by path.
- **NEVER use the Read tool on image files** (PNG, JPG, etc.). Vision tokens are far more expensive than text. Use bash one-liners to inspect image metadata if needed.

---

## Hardcoded Config Values

**Never change hardcoded config values** (`max_tokens`, row limits, sleep delays, score thresholds) without asking why they were set. Most of them are intentional cost/performance constraints from a past incident. Ask before touching.
