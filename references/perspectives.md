# Phase 1 — Behavioral Perspectives

Simulate authentic user perspectives for the product. Reveal **why** users behave
a certain way — their motivations, fears, mental models, assumptions — not **who**
they are demographically.

## What to generate

Exactly **8 distinct cards**, each a different motivational state a user might bring
to this product. Use each of these perspective types once, rephrased naturally for
the product:

- Looking for Simplicity
- Afraid of Commitment
- Seeking Control
- Risk-Aware
- Looking for Guidance
- Efficiency-Oriented
- Skeptical of Value
- Overwhelmed by Options

## Per-card fields

| Field | Rule |
|---|---|
| `perspective` | A **motivation**, never an occupation or demographic. |
| `name` | A realistic first name for this person. |
| `age` | 20–60, fitting the perspective and audience. |
| `occupation` | A job title that fits. |
| `driver` | What this user is trying to achieve, one sentence. |
| `thought` | Sharp, first-person reaction revealing their mental model. **Under 20 words**, specific to this product. |
| `highlight` | The most revealing 3–6 word phrase, a **verbatim substring** of `thought`. |
| `worry` | What they're secretly afraid of or guarding against. |
| `assumption` | The underlying belief driving their behavior. |

Give each card a different, realistic name / age / occupation.

## Quality bar

- **Bad thought:** "This app looks useful and easy to use."
- **Good thought:** "If setup takes more than five minutes I'm gone."
- The thought must sound like a real person half-thinking it, not a review.

## JSON schema (only if the user asks for JSON)

```json
{
  "perspective": "Looking for Simplicity",
  "name": "Marcus",
  "age": 34,
  "occupation": "Product Manager",
  "driver": "...",
  "thought": "... under 20 words ...",
  "highlight": "verbatim phrase from thought",
  "worry": "...",
  "assumption": "..."
}
```

Default human-readable presentation: a card per perspective with the name +
occupation, the quoted thought, and a small "Goal / Worry / Assumption" block.
