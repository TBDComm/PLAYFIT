# Web Interface Guidelines

**Source:** [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) + [vercel-labs/agent-skills — web-design-guidelines v1.0.0](https://github.com/vercel-labs/agent-skills)

Apply all rules below when writing UI code. Report violations as `file:line` during code review.

---

## Accessibility

- Icon-only buttons require `aria-label`
- Form controls require `<label>` or `aria-label`
- Interactive elements require keyboard handlers (`onKeyDown`/`onKeyUp`)
- Actions use `<button>`, navigation uses `<a>`/`<Link>` — never `<div onClick>`
- Images require `alt` (use `alt=""` for decorative images)
- Decorative icons require `aria-hidden="true"`
- Async updates (toasts, validation) require `aria-live="polite"`
- Prefer semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`) before reaching for ARIA
- Headings must be hierarchical `<h1>`–`<h6>`; include a skip link for main content
- Add `scroll-margin-top` on heading anchors

## Focus States

- Interactive elements require visible focus: `focus-visible:ring-*` or equivalent
- Never use `outline-none` / `outline: none` without a focus replacement
- Use `:focus-visible` over `:focus` (prevents focus ring on mouse click)
- Use `:focus-within` for compound controls

## Forms

- Inputs require `autocomplete` and a meaningful `name` attribute
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste with `onPaste` + `preventDefault`
- Labels must be clickable: use `htmlFor` or wrap the control
- Add `spellCheck={false}` on email, code, and username fields
- Checkboxes/radios: label and control share a single hit target (no dead zones)
- Submit button stays enabled until request starts; show spinner during request
- Show errors inline next to the field; focus the first error on submit
- Placeholders end with `…` and show an example pattern
- Add `autocomplete="off"` on non-auth fields to avoid password manager triggers
- Warn before navigation with unsaved changes (`beforeunload` or router guard)

## Animation

- Always honor `prefers-reduced-motion` (provide a reduced variant or disable entirely)
- Only animate `transform` and `opacity` (compositor-friendly)
- Never use `transition: all` — list properties explicitly
- Set a correct `transform-origin`
- SVG: apply transforms on a `<g>` wrapper with `transform-box: fill-box; transform-origin: center`
- Animations must be interruptible — respond to user input mid-animation

## Typography

- Use `…` not `...`
- Use curly quotes `"` `"` not straight `"`
- Use non-breaking spaces: `10&nbsp;MB`, `⌘&nbsp;K`, brand names
- Loading states end with `…`: `"Loading…"`, `"Saving…"`
- Use `font-variant-numeric: tabular-nums` for number columns and comparisons
- Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)

## Content Handling

- Text containers must handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` to allow text truncation
- Always handle empty states — never render broken UI for empty strings or arrays
- User-generated content: anticipate short, average, and very long inputs

## Images

- `<img>` requires explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images: `priority` or `fetchpriority="high"`

## Performance

- Lists over 50 items: virtualize (`virtua`, `content-visibility: auto`)
- No layout reads during render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)
- Batch DOM reads and writes; never interleave them
- Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke
- Add `<link rel="preconnect">` for CDN and asset domains
- Critical fonts: `<link rel="preload" as="font">` with `font-display: swap`

## Navigation & State

- URL must reflect state — filters, tabs, pagination, expanded panels go in query params
- Links use `<a>`/`<Link>` (supports Cmd/Ctrl+click, middle-click)
- Deep-link all stateful UI (consider URL sync via nuqs or similar)
- Destructive actions require a confirmation modal or undo window — never immediate

## Touch & Interaction

- `touch-action: manipulation` (prevents double-tap zoom delay)
- Set `-webkit-tap-highlight-color` intentionally
- `overscroll-behavior: contain` in modals, drawers, and sheets
- During drag: disable text selection, add `inert` on dragged elements
- Use `autoFocus` sparingly — desktop only, single primary input; avoid on mobile

## Safe Areas & Layout

- Full-bleed layouts require `env(safe-area-inset-*)` for notch devices
- Prevent unwanted scrollbars: `overflow-x-hidden` on containers, fix content overflow
- Use Flex/Grid for layout instead of JS measurement

## Dark Mode & Theming

- Add `color-scheme: dark` on `<html>` for dark themes (fixes scrollbars and form controls)
- `<meta name="theme-color">` must match the page background
- Native `<select>`: set explicit `background-color` and `color` (Windows dark mode)

## Locale & i18n

- Dates/times: use `Intl.DateTimeFormat`, never hardcoded formats
- Numbers/currency: use `Intl.NumberFormat`, never hardcoded formats
- Detect language via `Accept-Language` / `navigator.languages`, not IP

## Hydration Safety

- Inputs with `value` require `onChange` (or use `defaultValue` for uncontrolled)
- Date/time rendering: guard against hydration mismatch (server vs client)
- Use `suppressHydrationWarning` only where truly necessary

## Hover & Interactive States

- Buttons and links require a `hover:` state (visual feedback)
- Interactive states must increase contrast: hover/active/focus more prominent than rest

## Content & Copy

- Use active voice: "Install the CLI" not "The CLI will be installed"
- Title Case for headings and buttons (Chicago style)
- Use numerals for counts: "8 deployments" not "eight"
- Specific button labels: "Save API Key" not "Continue"
- Error messages must include the fix or next step, not just the problem
- Use second person; avoid first person
- Use `&` over "and" where space is constrained

---

## Anti-patterns (always flag these)

| Pattern | Reason |
|---------|--------|
| `user-scalable=no` / `maximum-scale=1` | Disables zoom — accessibility violation |
| `onPaste` + `preventDefault` | Blocks paste |
| `transition: all` | Must list properties explicitly |
| `outline-none` without replacement | No visible focus |
| `<div onClick>` for navigation | Must use `<a>` |
| `<div>`/`<span>` with click handlers | Must use `<button>` |
| Images without dimensions | Causes CLS |
| Large array `.map()` without virtualization | Performance problem |
| Form inputs without labels | Accessibility violation |
| Icon buttons without `aria-label` | Accessibility violation |
| Hardcoded date/number formats | Must use `Intl.*` |
| `autoFocus` without clear justification | Degrades mobile UX |

---

## Code Review Output Format

Group by file, use `file:line` format, keep findings terse:

```
## src/Button.tsx

src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:18 - input lacks label
src/Button.tsx:55 - animation missing prefers-reduced-motion handling
src/Button.tsx:67 - transition: all → list properties explicitly

## src/Modal.tsx

src/Modal.tsx:12 - missing overscroll-behavior: contain

## src/Card.tsx

✓ pass
```
