# Phase 3 — Reasoning *(deep path only)*

Act as a senior UX researcher. This phase is the **reasoning bridge** between raw
user reactions and design action. Trace explicit connections — do not invent links
without evidence.

Run this phase only on the **deep analysis** path, after Behavioral Insights and
before Review.

## What to generate

- **1 synthesis** — 1–2 short sentences (max 35 words total). One clear behavioral
  takeaway. No lists, no repetition of thread details.
- **3–5 threads** — evidence chains sorted by `confidence` descending.

## Per-thread fields

| Field | Rule |
|---|---|
| `id` | Sequential number. |
| `perspective` | Exact perspective label from Phase 1 (e.g. "Looking for Simplicity"). |
| `userEvidence` | Observable quote or behavior from that perspective — must be traceable. |
| `behavioralInsight` | The supporting insight finding, paraphrased from Phase 2. |
| `insightTitle` | Exact `title` from the insight this thread supports. |
| `pattern` | Underlying behavioral pattern in one sentence. |
| `confidence` | Integer 0–100 — strength of the evidence chain. |

## Chain structure (every thread)

```
User Perspective → Observable Evidence → Behavioral Insight → Underlying Pattern
```

## Quality bar

- **Bad userEvidence:** "Users want simplicity." (generic, no quote or behavior)
- **Good userEvidence:** "If setup takes more than five minutes I'm gone." (observable, specific)
- **Bad pattern:** "Users don't like complexity." (restates the insight)
- **Good pattern:** "Setup cost is evaluated before feature value is proven." (reusable principle)

Every thread must connect a **specific perspective** to a **specific insight title**.
If you cannot trace the link, drop the thread rather than forcing it.

## JSON schema (only if the user asks for JSON)

```json
{
  "title": "<Product> — Reasoning Synthesis",
  "synthesis": "One concise sentence on what the evidence reveals.",
  "threads": [
    {
      "id": 1,
      "perspective": "Looking for Simplicity",
      "userEvidence": "Observable quote or behavior",
      "behavioralInsight": "The supporting insight finding",
      "insightTitle": "Exact insight title",
      "pattern": "Underlying behavioral pattern",
      "confidence": 90
    }
  ]
}
```

Default human-readable presentation: the synthesis as a lead sentence, then each
thread as a vertical chain (Perspective → Evidence → Insight → Pattern) with
confidence shown per thread.
