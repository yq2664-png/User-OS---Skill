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

### No mood-only perspectives

Every thought must reveal a **decision, behavior, or mental model** — not just an
emotion. A feeling with no behavioral consequence is noise.

- **Reject (mood only):** "I'm excited about this!", "This feels overwhelming.",
  "I love the design.", "Not sure how I feel."
- **Keep (mood → behavior):** "This feels overwhelming, so I'd only turn on one
  feature and ignore the rest.", "Looks slick — but I'll wait for reviews before
  I trust it with real data."

If a thought is purely emotional, rewrite it so it exposes what the user would *do*
or *believe* as a result.

## Filter before presenting

Generate a few extra candidates, then run one filtering pass **before** showing
anything. Drop or rewrite any card that:

1. Is **mood-only** (no decision/behavior/belief).
2. **Duplicates** another card's underlying motivation.
3. Is **generic** — could apply to any product, not this one.
4. Has a `highlight` that isn't a verbatim substring of `thought`.

Only present the 8 that survive. Never show the rejects or the filtering process —
just the clean final set.

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
