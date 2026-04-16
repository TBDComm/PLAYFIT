# Code Review — Five-Axis Quality Gate

**Impact: HIGH**
Source: [addyosmani/agent-skills — Code Review and Quality](https://github.com/addyosmani/agent-skills)
Full guide: `.claude/skills/code-review-and-quality/SKILL.md`

Every change reviewed across five axes before merge. Approve when it **definitely improves overall code health**, even if imperfect.

---

## The Five Axes

### 1. Correctness
- Matches spec/task requirements?
- Edge cases handled (null, empty, boundary)?
- Error paths handled (not just happy path)?
- Off-by-one, race conditions, state inconsistencies?

### 2. Readability & Simplicity
- Names descriptive and consistent? (no `temp`, `data`, `result`)
- Control flow straightforward? (no nested ternaries, deep callbacks)
- Could this be done in fewer lines?
- Abstractions earning their complexity? (Don't generalize until 3rd use)
- Dead code artifacts? (`_unused` vars, `// removed` comments, compat shims)

### 3. Architecture
- Follows existing patterns or introduces new one with justification?
- Clean module boundaries maintained?
- Dependencies flowing in right direction? (no circular)
- Abstraction level appropriate?

### 4. Security
- User input validated and sanitized at system boundaries?
- Secrets out of code, logs, version control?
- Auth/authz checked where needed?
- SQL parameterized? Outputs encoded (XSS)?
- External data treated as untrusted?

### 5. Performance
- N+1 query patterns?
- Unbounded loops / unconstrained data fetching?
- Sync operations that should be async?
- Unnecessary re-renders in UI?
- Missing pagination on list endpoints?

---

## Finding Severity Labels

| Prefix | Meaning | Action |
|--------|---------|--------|
| *(none)* | Required | Must fix before merge |
| **Critical:** | Blocks merge | Security, data loss, broken functionality |
| **Nit:** | Minor, optional | Author may ignore |
| **Optional:** | Suggestion | Worth considering |

---

## Change Sizing

- ~100 lines: good
- ~300 lines: acceptable if single logical change
- ~1000 lines: too large — split it

Separate refactoring from feature work — they are different changes.

---

## Red Flags

- "It works, that's good enough" (ignoring readability/security/architecture)
- "I'll clean it up later" (never happens — require cleanup before merge)
- "AI-generated code is probably fine" (needs more scrutiny, not less)
- LGTM without evidence of actual review
- Large PRs that are "too big to review properly"
