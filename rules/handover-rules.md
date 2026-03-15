# Handover Writing Rules

Rules for maintaining HANDOVER.md. Follow these on every update — no exceptions.

---

## 1. ASK, NEVER ASSUME

**This is the most important rule in this entire file.**

If anything is unclear, ambiguous, or not explicitly specified — STOP and ask the user one question at a time before writing any code or making any decision.

**Never:**
- Fill gaps with assumptions
- Guess what the user probably wants
- Implement something "obvious" that wasn't asked for
- Proceed past a blocker by inventing a workaround

**Always:**
- State what is unclear
- Ask one specific question
- Wait for the answer before continuing

A wrong assumption wastes more time than asking. When in doubt, ask.

---

## 2. File Size Limit — 200 Lines Hard Cap

HANDOVER.md must never exceed 200 lines.

**At the top of every session**, check the line count:
```
📏 File health: [current lines]/200
```

If at or above 180 lines → compress before doing any other work (see Section 5).

**Section line budgets:**
| Section | Budget |
|---------|--------|
| Header + health check | 5 lines |
| Maintenance Protocol | 12 lines |
| Workspace Crash Prevention | 4 lines (fixed, never grows) |
| In-Progress Lock | 10 lines |
| Current Status | 30 lines |
| Active Step | 25 lines + SQL/code blocks exempt |
| Minor Changes Log | 12 lines |
| Completed Steps (all) | 5 lines × number of steps |
| Project Reference | 5 lines (fixed, never grows) |

When a section exceeds its budget, compress it immediately.

---

## 3. Section Order — Never Change

The file must always follow this exact order, top to bottom:

```
1. Header (title + one-line instruction)
2. 📏 File health check
3. Maintenance Protocol
4. Workspace Crash Prevention  ← permanent, never remove, never archive
5. 🔒 In-Progress Lock        ← always visible without scrolling
6. Current Status              ← always visible without scrolling
7. Active Step
8. Minor Changes Log
9. Completed Steps
10. Project Reference          ← stable, never grows
```

Sections 5 and 6 (Lock + Current Status) must always be reachable within the first 55 lines so any Claude session sees them immediately without scrolling.

**Workspace Crash Prevention** is a permanent section — it must never be removed, compressed, or moved to archive. Firebase Studio crashes cause total context loss. Keep it compact (≤ 3 lines) but always present.

---

## 4. Writing Style Rules

**Completed Step entries — max 5 lines each:**
```
### ✅ Step N — YYYY-MM-DD — [one-sentence summary]
- Files: [comma-separated list]
- Decisions: [reason] → [choice], [reason] → [choice]
- Watch out: [gotcha or edge case if any, else omit this line]
- Build: [build status one-liner]
```

**Active Step — max 25 lines (exception: SQL/code blocks required for the step are exempt):**
- Pre-flight check first (required keys, blockers)
- Files to create
- Logic spec (exact, no vague language)
- What this step does NOT include (scope boundary)
- "After completing" instruction
- **If this step is out of numbered order** (e.g. doing A9 before A6–A8): state the reason explicitly. Example: "A9 is done before A6–A8 because A9 tests already-implemented code and does not depend on A6–A8. A6–A8 add new features and follow after A9 passes."

**Minor Changes Log — one line per entry:**
```
| YYYY-MM-DD | [change description] | [files affected] |
```

**General writing rules:**
- Every sentence is either a fact, an instruction, or a decision + reason
- No vague language: "handle errors properly" → "return GENERAL_ERROR on catch"
- File paths always in backticks
- Error codes always in backticks
- Dates on every completed entry
- No passive voice in instructions: "Keys must be set" → "Set the key before proceeding"

---

## 5. Compression Protocol

Trigger: file reaches 180 lines, OR a completed step entry is more than 3 steps old.

**Steps to compress:**
1. Find the oldest detailed Completed Step entry
2. Reduce it to the 5-line format defined in Section 4
3. If the entry was already in 5-line format and the file is still over budget, move it to `HANDOVER-archive.md` with a one-line reference:
   ```
   - Step N archived → see HANDOVER-archive.md
   ```
4. Repeat until file is under 160 lines

**Never compress:**
- Workspace Crash Prevention
- In-Progress Lock
- Current Status
- Active Step
- Project Reference

---

## 6. Active Step Transition Protocol

When moving to a new step (after completing the previous one):

1. Read the relevant section from `SPEC.md`
2. Copy the **full spec** for that step into the ACTIVE STEP section of `HANDOVER.md`
3. Future sessions will have the spec inline — no need to open `SPEC.md`

**Active Step must always contain:**
- Prerequisites / blockers
- Exact files to create or modify
- Logic spec (precise, no vague language)
- Scope boundary (what this step does NOT include)
- "After completing" instruction

---

## 7. Archive Protocol

`HANDOVER-archive.md` stores compressed entries evicted from HANDOVER.md.

Format:
```
# HANDOVER Archive

## Step N — YYYY-MM-DD
[full entry that was compressed out of main file]
```

Archive file has no size limit. It is reference-only — Claude does not need to read it unless explicitly debugging a past decision.
