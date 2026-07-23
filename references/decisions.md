# Phase 4 — Product Decisions

Act as a principal product strategist. Translate the behavioral research into a
focused set of product decisions, each grounded in evidence.

Generate decisions from:
1. **Insights**
2. **Reasoning** (user evidence + behavior patterns + UX findings)
3. **UX Expert Perspective** findings

Every decision traces:

```
User Evidence → Behavioral Insight → UX Principle → Product Requirement
```

## What to generate

**5–6 decisions**, sorted by `priority` descending (Critical first).

Prefer decisions supported by Insights + Reasoning + UX Findings together.
At least 3 decisions should connect to a UX principle from UX Expert Perspective.

## Per-decision fields

| Field | Rule |
|---|---|
| `id` | Sequential number. |
| `name` | Short name for the decision, 3–5 words. |
| `priority` | Critical / High / Medium / Low — based on impact severity. |
| `impact` | High / Medium / Low — business value if addressed. |
| `confidence` | 0–100 integer — how strongly the research supports this decision. |
| `effort` | High / Medium / Low — estimated implementation complexity. |
| `problem` | Specific behavioral problem statement derived from the insights. |
| `userStory` | "When a user is [behavioral state], they need [capability] so they can [outcome]." Reference a **behavioral state**, not a demographic role. |
| `requirement` | Clear, testable product requirement addressing the problem. |
| `successMetric` | Measurable outcome signaling the **behavior has changed** — not just a feature-shipped metric. |
| `userEvidence` | Direct quote or observable behavior from Perspectives that supports this decision. |
| `behavioralInsight` | Exact insight title or finding this decision addresses. |
| `relatedHeuristic` | UX principle name from UX Expert Perspective (e.g. "Recognition Rather Than Recall") — no Nielsen numbers. |

## Quality bar

- `userStory` — **Bad:** "As a manager, I want dashboards." **Good:** "When a user is
  unsure the product is worth the setup cost, they need a 60-second win so they can
  justify continuing."
- `successMetric` — **Bad:** "Ship onboarding tooltips." **Good:** "% of new users
  reaching first meaningful action within one session rises from X to Y."
- `userEvidence` — **Bad:** "Users are frustrated." **Good:** A specific quote or
  behavior from a named perspective.

Every decision must cite the insight(s) it answers. If the research only weakly
supports a decision, lower its `confidence` rather than overstating it. Do not
invent problems not supported by the research.

## JSON schema (only if the user asks for JSON)

```json
{
  "title": "<Product> — Product Decision Framework",
  "sections": [
    {
      "id": 1,
      "name": "Short decision name",
      "priority": "Critical",
      "impact": "High",
      "confidence": 85,
      "effort": "Medium",
      "problem": "...",
      "userStory": "When a user is [state], they need [capability] so they can [outcome]",
      "requirement": "...",
      "successMetric": "...",
      "userEvidence": "Direct quote or observable behavior",
      "behavioralInsight": "Exact insight title",
      "relatedHeuristic": "Recognition Rather Than Recall"
    }
  ]
}
```

Default human-readable presentation: a prioritized table (name · priority · impact ·
confidence · effort) with an expandable block per decision showing the evidence
chain (user evidence → insight → UX principle → requirement) and success metric.
