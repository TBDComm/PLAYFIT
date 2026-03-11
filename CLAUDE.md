# PLAYFIT — Claude Code Instructions

> ## 🚨 MANDATORY — every session, every task, no exceptions
>
> **BEFORE doing anything:**
> 1. Read `HANDOVER.md` fully
> 2. Check the **In-Progress Lock** — if filled, resume from where the previous session stopped
> 3. Check **Current Status** — confirm the active step and any blockers
> 4. Before implementing any step → read `SPEC.md`
>
> **WHILE working:**
> - Fill in the In-Progress Lock at the start of any work
> - Update "Stopped at" continuously — interruption must always be safe to recover from
>
> **AFTER any work** (step or non-step, however small):
> - Clear the lock, update `HANDOVER.md` before reporting back — never skip

---

> ## ❌ NEVER ASSUME — ALWAYS ASK
>
> If anything is unclear, missing, or not explicitly specified: **stop and ask the user.**
> One question at a time. Wait for the answer. Do not proceed on assumptions.
>
> This applies to: implementation details, design decisions, scope boundaries, and any choice not explicitly defined.
>
> **A wrong assumption causes rework. A question takes 10 seconds.**

---

## Scope Policy

- `GEMINI.md` is for Firebase Studio's Gemini only — ignore it entirely
- MVP scope is strict — implement only what `SPEC.md` defines; never add features proactively
- When scope is unclear → ask before implementing

---

## Development Guidelines

Read the relevant rule file before writing code in that area.

| File | Priority | Covers |
|------|----------|--------|
| `rules/async-parallel.md` | CRITICAL | `Promise.all()`, no sequential await |
| `rules/bundle-barrel-imports.md` | CRITICAL | No barrel imports, direct paths |
| `rules/web-design-guidelines.md` | HIGH | Accessibility, focus, forms, animation |
| `rules/frontend-design.md` | HIGH | Aesthetics, no AI-slop |
| `rules/handover-rules.md` | CRITICAL | How to maintain `HANDOVER.md` |

---

## Coding Rules

- Comments in English
- TypeScript strict mode throughout
- All API calls (Steam, Claude, Supabase) via Next.js API routes only — never expose keys to frontend
- Always wrap Claude API response in try-catch + JSON.parse defense
- Working code first, optimization later
- File structure stays flat — no unnecessary nesting
