---
name: user-research-os
description: Simulate how multiple distinct users would react to a product before real users ever speak, then synthesize behavioral insights and concrete product decisions. Use whenever someone wants pre-launch user research, wants to pressure-test a product idea, asks "how would users react to X", needs a research-backed PRD, or wants to find friction / hidden needs / trust issues in a product or feature.
---

# User Research OS

Turn a product description into three research artifacts, in order:

1. **Behavioral Perspectives** — 8 distinct users react in their own voice.
2. **Behavioral Insights** — the patterns and friction underneath those reactions.
3. **Product Decisions** — a prioritized, evidence-backed set of moves.

This is a design-research reasoning workflow. It runs entirely in the model — no
API, no server. The value is in the *rigor*: reactions must reveal motivation,
insights must be reusable principles, and every decision must trace back to a real
observation.

## When to use

Trigger on any of these:
- "How would users react to <product / feature / idea>?"
- "Do pre-launch user research on this."
- "What friction / hidden needs / trust issues does this have?"
- "Turn this into a research-backed PRD / product decisions."
- The user pastes a product description, a spec, a landing page, or a repo and
  asks what users would think.

## Inputs you need

Before starting, make sure you have:
- **Product name**
- **What it does** — core functions, in plain language.
- **Stage** (optional) — pre-launch / live web product / client app. Shapes tone.
- **Context** (optional) — target audience, known pain points, constraints,
  research goals. If the user gave a repo or doc, read it for this.

If the product description is thin, ask **one** focused question to fill the
biggest gap, then proceed. Don't interrogate.

## Workflow

Run the three phases **in order**. Each phase's output feeds the next. Read the
matching reference file at the start of each phase — the exact schema, quality
bar, and worked examples live there.

### Phase 1 — Behavioral Perspectives
Read `references/perspectives.md`. Generate 8 perspective cards. Present them, then
continue (or pause if the user wants to edit the set).

### Phase 2 — Behavioral Insights
Read `references/insights.md`. Synthesize the 8 perspectives into ranked insights
across five categories. Present them.

### Phase 3 — Product Decisions
Read `references/decisions.md`. Translate the insights into 5–6 prioritized
product decisions. Present them as the final deliverable.

## Output style

- Default to **readable Markdown** (tables, headers) for a human reader.
- If the user asks for JSON or wants to pipe it into another tool, emit the exact
  JSON schemas defined in the reference files instead.
- Never invent data. Every insight cites a perspective; every decision cites an
  insight. If evidence is thin, say so and lower the confidence.

## The one rule that matters

Skip surface summaries. "Users are confused" is worthless. "Complexity is tolerated
only after value is proven" is a finding you can design against. Every phase should
move from *what a user said* → *why* → *what to do about it*.
