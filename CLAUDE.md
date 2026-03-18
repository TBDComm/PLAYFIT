# PLAYFIT — Claude Code Instructions

> ## MANDATORY — every session, every task, no exceptions
>
> **BEFORE doing anything:**
> 1. Read `HANDOVER.md` fully — this is the only mandatory read at session start
> 2. Check the **In-Progress Lock** — if filled, resume from where the previous session stopped
> 3. Check **Current Status** — confirm the active step and any blockers
> 4. Before implementing a step → read only the relevant section of `SPEC.md`
>    (if HANDOVER.md ACTIVE STEP already contains the full spec inline, skip SPEC.md entirely)
>
> **WHILE working:**
> - Fill in the In-Progress Lock at the start of any work
> - Update "Stopped at" continuously — interruption must always be safe to recover from
>
> **AFTER any work** (step or non-step, however small):
> - Clear the lock, update `HANDOVER.md` before reporting back — never skip

---

> ## NEVER ASSUME — ALWAYS ASK
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
| `rules/bundle-barrel-imports.md` | CRITICAL | No barrel imports, dynamic imports, conditional loading |
| `rules/rerender-optimization.md` | HIGH | No inline components, derived state, functional setState, useRef |
| `rules/web-design-guidelines.md` | HIGH | Accessibility, focus, forms, animation |
| `rules/frontend-design.md` | HIGH | Aesthetics, no AI-slop |
| `rules/handover-rules.md` | CRITICAL | How to maintain `HANDOVER.md` |

---

## File Reading Discipline

| File | When to read |
|------|-------------|
| `HANDOVER.md` | Every session — always |
| `SPEC.md` | Only when starting a new step, and only the relevant section |
| `SPEC_archive.md` | Only when modifying an already-implemented feature |
| `HANDOVER-archive.md` | Only when debugging a past implementation decision |
| Rule files | Only before writing code in that area |

**When transitioning to a new step:** copy the full spec section from `SPEC.md` into HANDOVER.md's ACTIVE STEP. Future sessions then need no SPEC.md read for that step.

---

## Language Rule — ALL Files

**Default language for all `.md` files is English.** Korean is allowed only when genuinely necessary — e.g. Korean UI label text, Korean-specific cultural context, or terms that lose meaning when translated. Do not default to Korean out of habit. This rule has been violated every session — check before writing.

---

## Coding Rules

- Comments in English
- TypeScript strict mode throughout
- All API calls (Steam, Claude, Supabase) via Next.js API routes only — never expose keys to frontend
- Always wrap Claude API response in try-catch + JSON.parse defense
- Working code first, optimization later
- File structure stays flat — no unnecessary nesting

---

## Proactive Improvement Rule

While implementing, if you identify a provably better approach than what is specified — based on documented API behavior, known technical constraints, or established best practices — stop and flag it before proceeding.

Format:

> **BETTER APPROACH:** [what the current spec says]
> → [what the better approach is]
> → [why it is better — cite specific technical reason, not opinion]
> → Proceed with original spec or switch to this approach?

Rules:

- Only raise this if the improvement is based on verifiable fact, not estimation or preference
- Do not silently implement a different approach without asking
- Do not raise minor stylistic differences — only raise it if it meaningfully affects performance, cost, reliability, or correctness
- One improvement flag at a time — do not bundle multiple suggestions together
- If told to proceed with the original, do not raise the same point again

---

## Documentation Optimization Goals

Every time you write or modify any `.md` file in this project, apply these three goals:

1. **Minimize token waste** — never repeat information that already exists elsewhere; archive what is no longer needed for active work
2. **Maximize token efficiency** — keep mandatory session-start reads as short as possible; put detail in on-demand files (SPEC.md, archives)
3. **Reduce context degradation** — Claude Code performance drops as context grows; every unnecessary line in always-read files is a cost paid every single session

When these goals conflict with completeness: prefer concise + correct over exhaustive. If a piece of information is only needed once or rarely, it belongs in an archive or reference file — not in HANDOVER.md or CLAUDE.md.
