# Phase 2 — Behavioral Insights

Act as a senior design researcher. Go beyond surface summaries and extract the
underlying behavioral patterns.

**Required phase.** Insights are the foundation for Reasoning and Decisions.

Synthesize from both Perspective outputs:
1. User Perspectives (Phase 1a)
2. UX Expert Perspective findings (Phase 1b)

When UX findings reinforce user perspectives, prioritize those patterns.

## Reasoning structure (every insight)

- **Observation** — what you can directly observe from the perspectives and/or UX findings.
- **Interpretation** — what this behavior means (the "why").
- **Behavioral Insight** — a sharp, reusable design principle.
  - e.g. "Power appears before value", "Flexibility creates decision paralysis",
    "Trust is lost faster than functionality."

## Categories

Produce insights across these five arrays. Each array holds **3–4 items**, sorted by
`score` descending:

- `frustrations`
- `hiddenNeeds`
- `decisionBarriers`
- `trustIssues`
- `opportunities`

## Per-insight fields

| Field | Rule |
|---|---|
| `rank` | Position within its array (1 = highest). |
| `title` | Concise, 5 words max. |
| `observation` | What users directly experience or do. |
| `interpretation` | Why this behavior occurs — the underlying cause. |
| `behavioralInsight` | Sharp, reusable principle — a research finding, not a feature summary. |
| `score` | Float 1.0–10.0 = frequency × severity × business impact. |
| `impact` | Critical (8–10), High (6–7.9), Medium (4–5.9), Low (1–3.9). |
| `valueNote` | One sentence: the business/retention consequence if left unaddressed. |

## Quality bar

- **Bad:** "Users are confused."
- **Good:** "Complexity is tolerated only after value is proven."

Every insight must be traceable to at least one Phase 1 perspective or UX finding.
Don't introduce patterns the evidence doesn't support.

## JSON schema (only if the user asks for JSON)

```json
{
  "frustrations": [
    {
      "rank": 1,
      "title": "Concise title",
      "observation": "...",
      "interpretation": "...",
      "behavioralInsight": "...",
      "score": 8.5,
      "impact": "Critical",
      "valueNote": "..."
    }
  ],
  "hiddenNeeds": [],
  "decisionBarriers": [],
  "trustIssues": [],
  "opportunities": []
}
```
