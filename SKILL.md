---
name: user-research-os
description: Simulate how multiple distinct users would react to a product before real users ever speak, then synthesize behavioral insights and concrete product decisions. Use whenever someone wants pre-launch user research, wants to pressure-test a product idea, asks "how would users react to X", needs a research-backed PRD, or wants to find friction / hidden needs / trust issues in a product or feature. Runs Perspectives (including UX Expert Perspective) → Insights → Reasoning → Decisions.
---

# User Research OS

Turn a product description into research artifacts, in order:

1. **Perspectives** — user perspectives + UX Expert Perspective findings.
2. **Insights** — behavioral patterns underneath that evidence.
3. **Reasoning** — explicit chains combining user evidence, behavior patterns, and UX findings.
4. **Decisions** — prioritized, evidence-backed product moves.

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
- **Stage** — pre-launch (unpublished) / live web product / client app. Shapes tone
  and what evidence is available.
- **Context** (optional) — target audience, known pain points, constraints,
  research goals. For pre-launch products, design documents or repo context count
  here.

If the product description is thin, ask **one** focused question to fill the
biggest gap, then proceed. Don't interrogate.

For local or code-based projects, read the repo or docs the user provides before
generating perspectives — the skill is designed to work from real project context.

## Workflow

Run phases **in order**. Each phase's output feeds the next. Read the matching
reference file at the start of each phase — the exact schema, quality bar, and
worked examples live there.

```
Perspectives
  (User Perspectives + UX Expert Perspective)
    ↓
Insights
    ↓
Reasoning
  (User Evidence + Behavior Patterns + UX Findings)
    ↓
Decisions
  (based on Insights + Reasoning + UX Findings)
```

### Phase 1 — Perspectives
Read `references/perspectives.md` and `references/ux-expert-perspective.md`.

1. Generate **8 user perspective cards**.
2. Generate **UX Expert Perspective** key findings (Nielsen-based analysis of the
   product itself — location-level UX issues presented as findings, not a product
   score or overall conclusion).
3. Present both. Pause if the user wants to edit the set.

### Phase 2 — Behavioral Insights
Read `references/insights.md`. Synthesize user perspectives **and** UX Expert
findings into ranked insights across five categories. Present them.

### Phase 3 — Reasoning
Read `references/reasoning.md`. Trace 3–5 evidence chains that combine:
- User evidence
- Behavior patterns (from Insights)
- UX findings (from UX Expert Perspective)

Present the synthesis and threads.

### Phase 4 — Product Decisions
Read `references/decisions.md`. Translate the research into 5–6 prioritized
product decisions grounded in Insights + Reasoning + UX Findings. Each decision
should cite user evidence, a behavioral insight, and a UX principle when available.

## Output style

- Default to **readable Markdown** (tables, headers) for a human reader.
- If the user asks for JSON or wants to pipe it into another tool, emit the exact
  JSON schemas defined in the reference files instead.
- Never invent data. Every insight cites evidence; every decision cites an insight
  (and UX finding when relevant). If evidence is thin, say so and lower the
  confidence.

## The one rule that matters

Skip surface summaries. "Users are confused" is worthless. "Complexity is tolerated
only after value is proven" is a finding you can design against. Every phase should
move from *what a user said* → *why* → *what to do about it*.
