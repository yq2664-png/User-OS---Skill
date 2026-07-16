---
name: user-research-os
description: Simulate how multiple distinct users would react to a product before real users ever speak, then synthesize behavioral insights and concrete product decisions. Use whenever someone wants pre-launch user research, wants to pressure-test a product idea, asks "how would users react to X", needs a research-backed PRD, or wants to find friction / hidden needs / trust issues in a product or feature. Supports a standard path (Perspectives → Insights → Decisions) or a deep path that adds Reasoning and multi-framework Review before Decisions.
---

# User Research OS

Turn a product description into research artifacts, in order:

1. **Behavioral Perspectives** — 8 distinct users react in their own voice.
2. **Behavioral Insights** — the patterns and friction underneath those reactions.
3. **Product Decisions** — a prioritized, evidence-backed set of moves.

**Deep analysis** adds two phases between Insights and Decisions:

4. **Reasoning** — explicit evidence chains linking perspectives to insights.
5. **Review** — multi-framework design evaluation grounded in that evidence.

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

## Choose analysis depth

After Phase 1 (Perspectives), ask which path the user wants — or infer from their
request:

| Path | When to use | Phases |
|---|---|---|
| **Standard** | Fast turnaround; decisions from insights alone | Perspectives → Insights → Decisions |
| **Deep** | Design critique, heuristic audit, or evidence chains needed | Perspectives → Insights → Reasoning → Review → Decisions |

Both paths **require Insights**. Never skip from Perspectives straight to Decisions.

Default to **Standard** unless the user asks for design review, heuristic
evaluation, reasoning chains, or UX audit language.

## Workflow

Run phases **in order**. Each phase's output feeds the next. Read the matching
reference file at the start of each phase — the exact schema, quality bar, and
worked examples live there.

### Phase 1 — Behavioral Perspectives
Read `references/perspectives.md`. Generate 8 perspective cards. Present them, then
continue (or pause if the user wants to edit the set).

### Phase 2 — Behavioral Insights
Read `references/insights.md`. Synthesize the 8 perspectives into ranked insights
across five categories. Present them.

### Phase 3 — Reasoning *(deep path only)*
Read `references/reasoning.md`. Trace 3–5 explicit evidence chains from user
perspectives through behavioral insights to underlying patterns. Present the
synthesis and threads.

### Phase 4 — Review *(deep path only)*
Read `references/review.md`. Evaluate the product through applicable UX frameworks
(Nielsen, WCAG, Apple HIG, Material, Cognitive Load, Trust). Only include
frameworks with evidence-backed findings. Present findings grouped by framework.

### Phase 5 — Product Decisions
Read `references/decisions.md`. Translate the research into 5–6 prioritized
product decisions. On the deep path, each decision must also connect to a design
framework principle from Review.

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
