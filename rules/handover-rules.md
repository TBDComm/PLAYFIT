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
| Maintenance Protocol | 20 lines |
| In-Progress Lock | 10 lines |
| Current Status | 15 lines |
| Active Step | 25 lines |
| Minor Changes Log | 12 lines |
| Completed Steps (all) | 5 lines × number of steps |
| Project Reference | 65 lines (fixed, never grows) |

When a section exceeds its budget, compress it immediately.

---

## 3. Section Order — Never Change

The file must always follow this exact order, top to bottom:

```
1. Header (title + one-line instruction)
2. 📏 File health check
3. Maintenance Protocol
4. 🔒 In-Progress Lock        ← always visible without scrolling
5. Current Status              ← always visible without scrolling
6. Active Step
7. Minor Changes Log
8. Completed Steps
9. Project Reference           ← stable, never grows
```

Sections 4 and 5 (Lock + Current Status) must always be reachable within the first 50 lines so any Claude session sees them immediately without scrolling.

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

**Active Step — max 25 lines:**
- Pre-flight check first (required keys, blockers)
- Files to create
- Logic spec (exact, no vague language)
- What this step does NOT include (scope boundary)
- "After completing" instruction

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
- In-Progress Lock
- Current Status
- Active Step
- Project Reference

---

## 6. Archive Protocol

`HANDOVER-archive.md` stores compressed entries evicted from HANDOVER.md.

Format:
```
# HANDOVER Archive

## Step N — YYYY-MM-DD
[full entry that was compressed out of main file]
```

Archive file has no size limit. It is reference-only — Claude does not need to read it unless explicitly debugging a past decision.
