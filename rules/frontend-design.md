# Frontend Design

**Source:** [anthropics/skills — frontend-design](https://github.com/anthropics/skills)

Establish context and commit to a bold aesthetic direction **before writing a single line of code**.
Avoid generic "AI-slop" aesthetics. Every design decision should reflect the specific product's identity.

---

## Core Principles

**"Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work."**

1. **Identify purpose and audience** — understand what the service is and who it's for
2. **Commit to an aesthetic direction** — brutalist, maximalist, retro-futuristic, refined minimal, etc.
3. **Assess technical constraints** — stack, bundle size, accessibility requirements
4. **Define a differentiation strategy** — what makes this product memorable

---

## Typography

- **Choose distinctive fonts** — avoid Arial, Inter, and other generic defaults; pick fonts that match the aesthetic direction
- Pair fonts intentionally — clear contrast between headings and body text
- Use size hierarchy to communicate information structure visually

## Color & Theme

- Build a cohesive palette with CSS variables
- Use a dominant color + a sharp accent color
- **Avoid overused cliché combinations** — especially purple gradients, generic blue-white
- Handle dark mode with `color-scheme: dark` + CSS variables for consistency

## Composition & Layout

- Use **asymmetry, overlap, and varied spacing** over predictable grid layouts
- Treat whitespace as a design element — don't fill every inch
- Align content flow to match the natural reading/scrolling direction

## Motion & Animation

- **Accessibility first** — detect `prefers-reduced-motion: reduce` and remove or replace animations immediately
- Use animation only where it adds meaning; keep it minimal and purposeful
- Only animate `transform` and `opacity` (compositor-friendly)
- Never use `transition: all` — list properties explicitly
- Effects like staggered reveals and scroll-triggered animations are only applied under `prefers-reduced-motion: no-preference`

## Visual Details

- Create **depth and atmosphere** through gradients, textures, patterns, and contextual effects
- Drop shadows should convey meaning (lifted cards, modals) — never decorative overuse
- Icons assist UX — avoid excessive decorative use

---

## Anti-patterns (always avoid)

| Pattern | Reason |
|---------|--------|
| Purple gradient hero section | The defining AI-slop cliché |
| "Roboto + blue + white card" combination | Context-free default |
| All sections with identical spacing and size | No visual rhythm |
| `system-ui`/`sans-serif` only, no custom font | No character |
| All buttons styled identically | No hierarchy |

---

## Code Quality

- All code must be production-ready in completeness
- Match implementation complexity to the aesthetic direction:
  - Maximalist → rich CSS, layered effects
  - Minimalist → precise spacing, typography focus
- Reflect design decisions at component boundaries — keep styles separate from logic
