# Workflow Optimization Log

**Date:** 2026-03-14
**Purpose:** Token efficiency, reduced context bloat, improved Claude Code performance across sessions

---

## Problem Statement

As the project grew, each Claude Code session was consuming ~840 lines of context before any actual work began. This caused:
- Wasted tokens on already-implemented content read every session
- Slower responses as context window filled earlier
- Risk of context overflow on long sessions (Firebase Studio has 8GB RAM, no swap)

---

## Before: Session Start Token Cost

| File | Lines consumed | Reason |
|------|---------------|--------|
| CLAUDE.md | ~60 | Auto-loaded always |
| MEMORY.md | ~39 | Auto-loaded always (had duplicates) |
| HANDOVER.md | ~180 | Rule: mandatory read every session |
| SPEC.md | ~600 | Rule: read before implementing any step |
| **Total** | **~879 lines** | Before any real work |



---

## After: Session Start Token Cost

| File | Lines consumed | Reason |
|------|---------------|--------|
| CLAUDE.md | ~65 | Auto-loaded always (slightly larger — added reading rules) |
| MEMORY.md | ~22 | Auto-loaded, duplicates removed |
| HANDOVER.md | ~107 | Rule: mandatory read every session (compressed) |
| SPEC.md | **0** | Not read at session start anymore |
| **Total** | **~194 lines** | Before any real work |

**Reduction: ~685 lines per session (~78% less)**

When implementing a step, SPEC.md section is read on demand (~30–50 lines for relevant section only, vs 600 lines for full file).

---

## Changes Made

### HANDOVER.md — 180 → 137 lines
- Compressed workspace crash prevention: 20 lines → 4 lines (content preserved, wording tightened)
- Compressed in-progress lock template: 15 → 10 lines
- Moved completed step logs (A2, A3+A4, A5) → `HANDOVER-archive.md`
- Trimmed minor changes log to 4 most recent entries
- Note: Active Step contains 28-line SQL block (necessary for A9 prerequisites) — exempt from 25-line budget per handover-rules.md §4

### SPEC.md — ~600 → ~490 lines
- Removed SteamSpy API Specification → `SPEC_archive.md`
- Removed DB Build Script Specification → `SPEC_archive.md`
- Removed Feedback → Tag Weight Update Logic → `SPEC_archive.md`

### SPEC_archive.md — created (new)
- Stores full spec for completed, standalone sections
- Read only when modifying an already-implemented feature

### HANDOVER-archive.md — appended
- Added A2, A3+A4, A5 completed step logs

### CLAUDE.md — updated
- Rule 4 changed: "read SPEC.md before implementing" → "read only the relevant section, skip if ACTIVE STEP has it inline"
- Added `## File Reading Discipline` section with explicit per-file read triggers

### rules/handover-rules.md — updated
- Added `§6 Active Step Transition Protocol`: when starting a new step, copy full SPEC.md section into HANDOVER.md ACTIVE STEP so future sessions need no SPEC.md read

### MEMORY.md — updated
- Removed Development Guidelines section (duplicated rule files)
- Removed Scope Policy section (duplicated CLAUDE.md)
- Updated Project Overview to current state
- Updated Session Start section with new reading discipline

---

## New Workflow Principles

### 1. HANDOVER.md is the single entry point
Every session starts and ends with HANDOVER.md. It contains everything needed to resume work: lock state, current step, full spec for the active step inline.

### 2. SPEC.md is a reference, not a boot file
SPEC.md is never read at session start. It is read only when transitioning to a new step, and only the relevant section. Once copied to HANDOVER.md ACTIVE STEP, it is not needed again during that step.

### 3. Archives are write-once, rarely read
`HANDOVER-archive.md` and `SPEC_archive.md` grow over time but are almost never opened. They exist for audit and debugging purposes only. Never put rules or operational info in archive files.

### 4. Crash prevention stays prominent
Workspace crash prevention (OOM from `npm run build`) stays in HANDOVER.md permanently — compressed but always visible. Firebase Studio crashes cause total context loss, so this cannot be archived.

### 5. Rules live only in always-read files
Any behavioral rule for Claude Code must live in either `CLAUDE.md` (auto-loaded) or `rules/handover-rules.md` (read when doing HANDOVER work). Rules written anywhere else will be ignored by future sessions.

---

## File Responsibility Map (post-optimization)

| File | Read when | Written when | Size target |
|------|-----------|-------------|-------------|
| `CLAUDE.md` | Every session (auto) | Workflow rule changes only | < 80 lines |
| `MEMORY.md` | Every session (auto) | New persistent facts | < 30 lines |
| `HANDOVER.md` | Every session | Every work unit | < 130 lines |
| `SPEC.md` | New step start (section only) | New features added | < 500 lines |
| `HANDOVER-archive.md` | Debugging past decisions | Step completion | Unlimited |
| `SPEC_archive.md` | Modifying old features | Step completion | Unlimited |
| Rule files | Before writing code in area | Rule changes only | Unchanged |

---

## How This Self-Maintains

When a step is completed:
1. Log summary added to HANDOVER.md completed section
2. ACTIVE STEP updated with next step spec (copied from SPEC.md)
3. When HANDOVER.md approaches 180 lines → oldest completed logs move to HANDOVER-archive.md

When SPEC.md grows:
- Completed sections are archived to SPEC_archive.md after implementation
- Pending sections stay in SPEC.md at full detail

The system stays efficient as long as:
- HANDOVER.md ACTIVE STEP always has the current step spec inline
- Completed logs are moved to archive before HANDOVER.md hits 180 lines
- SPEC.md completed sections are archived after each step finishes
