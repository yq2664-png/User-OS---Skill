# Phase 4 — Review *(deep path only)*

Act as a senior UX researcher performing a **multi-framework design review**. This
is NOT a generic audit — evaluate the product only through frameworks where the
user evidence actually applies. Skip frameworks with no supporting evidence.

Run this phase only on the **deep analysis** path, after Reasoning and before
Product Decisions.

## Review frameworks

Use these framework IDs when generating output:

| `frameworkId` | Framework |
|---|---|
| `nielsen` | Nielsen Heuristics |
| `wcag` | WCAG Accessibility |
| `apple-hig` | Apple Human Interface Guidelines |
| `material` | Material Design |
| `cognitive-load` | Cognitive Load |
| `trust` | Trust & UX Patterns |

### Framework scope (when citing principles)

- **Nielsen** — Visibility of System Status, Match Between System and Real World,
  User Control and Freedom, Consistency and Standards, Error Prevention,
  Recognition Rather Than Recall, Flexibility and Efficiency, Aesthetic and
  Minimalist Design, Help Users Recognize/Diagnose/Recover from Errors, Help and
  Documentation
- **WCAG** — Perceivable, Operable, Understandable, Robust (cite specific success
  criteria when relevant)
- **Apple HIG** — Clarity, Deference, Depth, platform conventions, navigation
  patterns, feedback
- **Material** — Material metaphor, motion, layout, typography, color system,
  component patterns
- **Cognitive Load** — Intrinsic, extraneous, germane load; working memory limits;
  decision fatigue; information scent
- **Trust** — Transparency, predictability, social proof, error recovery, data
  handling signals, consent patterns

## What to generate

- **1 synthesis** — 1–2 short sentences (max 35 words). Cross-framework takeaway
  only — no lists.
- **Framework blocks** — only frameworks with at least one evidence-backed finding.
  Each included framework has **1–3 findings** (not more).

## Per-finding fields

| Field | Rule |
|---|---|
| `id` | Sequential within the framework. |
| `principle` | Specific heuristic, WCAG criterion, HIG principle, Material pattern, cognitive load factor, or trust pattern. |
| `relevance` | Why this principle applies to this specific evidence. |
| `evidence` | Observable user behavior from Phase 1 perspectives. |
| `behavioralInsight` | Supporting insight from Phase 2. |
| `implication` | Concrete design direction — not vague advice. |
| `severity` | Low / Medium / High |
| `confidence` | Integer 0–100 |
| `sourcePerspective` | Exact perspective label from Phase 1. |
| `sourceInsightTitle` | Exact insight title from Phase 2. |

## Chain structure (every finding)

```
User Perspective → Behavioral Insight → Design Framework Principle → Design Implication
```

## Quality bar

- **Bad implication:** "Improve the UX." (not actionable)
- **Good implication:** "Show setup progress and time-to-first-value before asking for account creation." (concrete direction)
- **Bad framework use:** Listing all six frameworks with generic findings.
- **Good framework use:** Including only Nielsen and Trust because those are the only frameworks the evidence supports.

Do not force findings into a framework. An empty framework is better than a fabricated one.

## JSON schema (only if the user asks for JSON)

```json
{
  "title": "<Product> — AI Design Review",
  "synthesis": "One concise cross-framework takeaway.",
  "frameworks": [
    {
      "frameworkId": "nielsen",
      "framework": "Nielsen Heuristics",
      "findings": [
        {
          "id": 1,
          "principle": "Recognition Rather Than Recall",
          "relevance": "Why this heuristic applies",
          "evidence": "Observable user behavior",
          "behavioralInsight": "Supporting insight",
          "implication": "Concrete design direction",
          "severity": "High",
          "confidence": 90,
          "sourcePerspective": "Looking for Simplicity",
          "sourceInsightTitle": "Exact insight title"
        }
      ]
    }
  ]
}
```

Default human-readable presentation: synthesis first, then one section per
framework with findings as expandable cards showing the evidence chain and
implication.
