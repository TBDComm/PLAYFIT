# GUILDELINE — Claude Code Instructions

> ## MANDATORY — every session, every task, no exceptions
>
> **BEFORE doing anything:**
> 1. Read `HANDOVER.md` fully — the only mandatory read at session start
> 2. Check the **In-Progress Lock** — if filled, resume from where the previous session stopped
> 3. Check **Current Status** — confirm the active step and any blockers
> 4. Before implementing a step → read only the relevant section of `SPEC.md` (use its Section Index, not the whole file). If HANDOVER.md's ACTIVE STEP already has the full spec inline, skip `SPEC.md` entirely.
>
> **WHILE working:**
> - Fill in the In-Progress Lock at the start of any work
> - Update "Stopped at" continuously — interruption must always be safe to recover from
>
> **AFTER any work** (step or non-step, however small):
> - Clear the lock, update `HANDOVER.md` before reporting back — never skip
> - Include `HANDOVER.md` in the **same** `git commit` as the code — never a separate commit or push

---

> ## NEVER ASSUME — ALWAYS ASK
>
> If anything is unclear, missing, or not explicitly specified: **stop and ask the user.** One question at a time. Wait for the answer. Do not proceed on assumptions.
>
> Applies to: implementation details, design decisions, scope boundaries, and any choice not explicitly defined. A wrong assumption causes rework. A question takes 10 seconds.

---

## Scope Policy

- `GEMINI.md` is for Firebase Studio's Gemini only — ignore it entirely
- MVP scope is strict — implement only what `SPEC.md` defines; never add features proactively
- When scope is unclear → ask before implementing

---

## Development Guidelines — Rule Files

Each rule has a one-line summary below. **Only read the full file when you suspect a violation or are about to write code in that area.** Never re-read a rule file you already loaded this session.

| File | Priority | One-line summary |
|------|----------|------------------|
| `rules/async-parallel.md` | CRITICAL | Parallelize independent I/O with `Promise.all`; never `await` sequentially unless there's a data dependency. |
| `rules/bundle-barrel-imports.md` | CRITICAL | No barrel imports. Import directly from the source file. Use dynamic imports for large optional deps. |
| `rules/rerender-optimization.md` | HIGH | No inline-defined components, prefer derived state over duplicated state, functional setState, `useRef` for non-reactive values. |
| `rules/web-design-guidelines.md` | HIGH | Accessibility + focus + forms + animation — specific a11y rules (aria-label, focus-visible, label/for, etc.). |
| `rules/frontend-design.md` | HIGH | Aesthetic direction — no AI-slop (no purple gradient hero, no "Roboto + blue + white card", etc.). Commit to a direction before coding. |
| `rules/handover-rules.md` | CRITICAL | How to maintain `HANDOVER.md` — 200-line cap, section order, writing style, compression, ACTIVE STEP lifecycle. |
| `rules/cf-gotchas.md` | HIGH | Hard-won CF Pages + React gotchas — `req.nextUrl` null, edge vs `generateStaticParams`, ref+early-return, favicon location. Read when debugging a build/edge/ref bug. |

---

## File Reading Discipline

| File | When to read |
|------|-------------|
| `HANDOVER.md` | Every session — always |
| `SPEC.md` | Only when starting a new step. Use the **Section Index at lines 19–43** to pick the line range for your step |
| `/home/user/.claude/plans/purrfect-mapping-pelican.md` | When starting SQ-1~SQ-6 — authoritative implementation plan |
| `SPEC_archive.md` | Only when modifying an already-implemented feature. Completed phases (A, B, C, FT, S, **CE**) live here — use its Section Index to jump by line |
| `HANDOVER-archive.md` | Only when debugging a past decision or looking up old minor-change rationale — use its Section Index |
| `memory/project_stack.md` | Only when touching env vars, auth config, or adding a new Supabase table |
| Rule files | Only before writing code in that area, and only if you haven't already read it this session |

**When transitioning to a new step:** copy the full spec section from `SPEC.md` into HANDOVER.md's ACTIVE STEP. Future sessions then skip `SPEC.md` entirely for that step. **When completing the step:** remove the inlined spec from ACTIVE STEP and replace with a `SPEC_archive.md` pointer (`rules/handover-rules.md §6`).

---

## Token-Efficient Reading

Every archive and long spec file has a **Section Index at the top**. Read the index first, then use `Read(file_path, offset, limit)` with only the range you need.

**Task → file routing:**

| Starting work on... | Read this |
|---|---|
| SQ-series (any step) | `HANDOVER.md` (always) + `SPEC.md` lines 1–43 (Phase Status + Section Index) + the specific SQ-N range from the index |
| Squad implementation detail (subrequest budget, commit order, verification) | `/home/user/.claude/plans/purrfect-mapping-pelican.md` |
| Debugging a completed CE item | `SPEC_archive.md` lines 1–40 (index) → jump to the CE-N line from the per-step table |
| Debugging an old auth/Steam behavior | `SPEC_archive.md` index → Phase B section range |
| Looking up an old minor change | `HANDOVER-archive.md` lines 1–42 (index) → date range |
| Writing code in an area governed by a rule | Only the one `rules/*.md` file that applies |
| CF Pages / edge / ref / build bug | `rules/cf-gotchas.md` |
| Ultimate-vision framing | `memory/project_ultimate_vision.md` |

**Anti-patterns (token waste):**
- Reading `SPEC_archive.md` or `HANDOVER-archive.md` without `offset`/`limit` — they are 2000+ and 400+ lines.
- Reading `SPEC.md` for a step that's already inlined in HANDOVER.md's ACTIVE STEP.
- Re-reading a rule file you already read this session.
- Re-reading a file right after editing it (the harness tracks edits; trust your last write).
- Grepping for a CE item when the per-step line index in `SPEC_archive.md` already points straight at it.
- Loading `memory/project_stack.md` when you're not touching infra — it's behind an explicit pointer for a reason.

---

## Language Rule — ALL .md Files

**Default language for all `.md` files is English.** Korean is allowed only when genuinely necessary — e.g. Korean UI label text, Korean-specific cultural context, or terms that lose meaning when translated. Do not default to Korean out of habit. This rule has been violated before — check before writing.

Code file comments are a separate rule (see below).

---

## Coding Rules

- **Comments in Korean** (code files only — .md files follow the language rule above)
- TypeScript strict mode throughout
- All API calls (Steam, Claude, Supabase) via Next.js API routes only — never expose keys to the frontend
- Always wrap Claude API responses in try-catch + JSON.parse defense
- Working code first, optimization later
- File structure stays flat — no unnecessary nesting

**CF Pages / edge / React / image / hardcoded-value gotchas** → `rules/cf-gotchas.md`. Read when touching an edge route, a `[param]` route, a ref-dependent component, an image asset, or any hardcoded numeric constant. Otherwise don't re-read.

---

## Proactive Improvement Rule

While implementing, if you identify a provably better approach than what is specified — based on documented API behavior, known technical constraints, or established best practices — stop and flag it before proceeding.

Format:

> **BETTER APPROACH:** [what the current spec says]
> → [what the better approach is]
> → [why it is better — cite specific technical reason, not opinion]
> → Proceed with original spec or switch to this approach?

Rules:
- Only raise this if the improvement is based on verifiable fact, not preference
- Do not silently implement a different approach without asking
- Do not raise minor stylistic differences — only raise it if it meaningfully affects performance, cost, reliability, or correctness
- One improvement flag at a time
- If told to proceed with the original, do not raise the same point again

---

## Documentation Optimization Goals

Every time you write or modify any `.md` file:

1. **Minimize token waste** — never repeat information that already exists elsewhere; archive what is no longer needed for active work
2. **Maximize token efficiency** — keep mandatory session-start reads (`HANDOVER.md`, `CLAUDE.md`, `MEMORY.md`) as short as possible; put detail behind Section Indexes in on-demand files
3. **Reduce context degradation** — every unnecessary line in always-read files is a cost paid every single session

When these goals conflict with completeness: prefer concise + correct over exhaustive. If a piece of information is only needed once or rarely, it belongs in an archive or memory file — not in HANDOVER.md or CLAUDE.md.
