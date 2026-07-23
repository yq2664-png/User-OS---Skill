# Phase 1b — UX Expert Perspective

Act as a senior UX expert. Inspect the **product itself** — screens, flows, and
interface areas — and produce key findings that later Insights, Reasoning, and
Decisions can cite.

Use **Nielsen's 10 Usability Heuristics** as the analytical basis. Do **not** lead
with "Nielsen Heuristic #N" as the main content. Present findings in plain UX
language; mention Nielsen only as the basis (footer / note).

## What to generate

**4–6 key findings**, sorted by `impact` (High first).

Do **not** write an overall product conclusion or review essay.
Reject openings like "Overall, the product presents a visually appealing…"

## Per-finding fields

| Field | Rule |
|---|---|
| `id` | Sequential number. |
| `title` | Short finding name, 3–5 words (e.g. "Onboarding Complexity"). |
| `finding` | Plain-language UX finding — what users cannot easily do or understand. No heuristic numbers. |
| `why` | One sentence explaining the cause in usability terms. |
| `principle` | Exact Nielsen heuristic **name** only (no number, no "Nielsen" prefix). |
| `recommendation` | Concrete, actionable fix. |
| `impact` | Low / Medium / High. |

## Presentation (default Markdown)

```
## UX Expert Perspective

### Key Findings

#### 01 — Onboarding Complexity

**UX Finding**
New users may struggle to understand where to start due to the complexity of available features.

**Why**
The interface presents too many options at once and relies on prior product knowledge.

**UX Principle**
Recognition Rather Than Recall

**Impact**
High

**Recommendation**
Provide clearer onboarding guidance and progressive disclosure.

---

Based on Nielsen's Usability Heuristics
```

## Nielsen principles (use exact names)

1. Visibility of System Status
2. Match Between System and the Real World
3. User Control and Freedom
4. Consistency and Standards
5. Error Prevention
6. Recognition Rather Than Recall
7. Flexibility and Efficiency of Use
8. Aesthetic and Minimalist Design
9. Help Users Recognize, Diagnose, and Recover from Errors
10. Help and Documentation

## Quality bar

- **Bad finding:** "Usability could be improved." (vague, no location/behavior)
- **Good finding:** "Users cannot easily understand what to do next after signup."
- **Bad why:** "Heuristic 6 is violated." (framework-first)
- **Good why:** "The interface relies on memory rather than recognition."

Every finding must be specific enough for Insights / Reasoning / Decisions to
reference by title.

## JSON schema (only if the user asks for JSON)

```json
{
  "title": "<Product> — UX Expert Perspective",
  "findings": [
    {
      "id": 1,
      "title": "Onboarding Complexity",
      "finding": "Users may struggle to understand where to start.",
      "why": "Too many options appear at once; the UI relies on prior knowledge.",
      "principle": "Recognition Rather Than Recall",
      "recommendation": "Add progressive disclosure and clearer first-run guidance.",
      "impact": "High"
    }
  ]
}
```
