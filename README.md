# User Research OS — Skill

Pre-launch user research for your LLM. Simulate how distinct users would react to a product, extract behavioral insights, and turn them into evidence-backed product decisions — before real users ever speak.

**Web app:** [user-perspective-simulator](https://github.com/yq2664-png/user-perspective-simulator)

---

## What this is

This repository contains the **User Research OS skill** — a Markdown workflow you install into Cursor, Claude, or any LLM that supports skills / project instructions.

The skill runs entirely in the model. No API key, no server. You describe a product; the model follows a structured research pipeline with quality bars at every step.

## Install

### Cursor

1. Download or clone this repository.
2. Copy `SKILL.md` into your Cursor skills folder, or add this repo as a skill source.
3. Copy the `references/` folder alongside it — the skill reads these files during each phase.

### Claude / other LLMs

1. Clone this repo.
2. Add `SKILL.md` to your project instructions or custom instructions.
3. Keep `references/` in the same project so the model can read the phase schemas.

```bash
git clone https://github.com/yq2664-png/User-OS---Skill.git
```

For local or code-based projects, point the model at your repo or design docs when running the skill — context quality directly affects perspective quality.

## Workflow

After you provide a product name and description, the skill runs phases in order:

| Phase | Output |
|---|---|
| **Perspectives** | 8 distinct user reactions revealing motivation and mental models |
| **Insights** | Ranked behavioral patterns across frustrations, hidden needs, trust issues, and more |
| **Reasoning** *(deep path)* | Evidence chains linking perspectives → insights → patterns |
| **Review** *(deep path)* | Multi-framework design evaluation (Nielsen, WCAG, HIG, Material, Cognitive Load, Trust) |
| **Decisions** | 5–6 prioritized product decisions with requirements and success metrics |

### Choose your depth

| Path | Phases | Best for |
|---|---|---|
| **Standard** | Perspectives → Insights → Decisions | Fast turnaround |
| **Deep** | Perspectives → Insights → Reasoning → Review → Decisions | Design critique, heuristic audit, evidence chains |

Both paths require **Insights**. The skill will not skip straight from Perspectives to Decisions.

## Repository structure

```
SKILL.md                  # Main skill instructions — install this
references/
  perspectives.md         # Phase 1 schema and quality bar
  insights.md             # Phase 2 schema and quality bar
  reasoning.md            # Phase 3 schema (deep path)
  review.md               # Phase 4 schema (deep path)
  decisions.md            # Phase 5 schema
```

## Example prompts

- "How would users react to this onboarding flow?"
- "Do pre-launch user research on [product name]."
- "What friction and trust issues does this feature have?"
- "Run deep analysis — I want reasoning chains and a design review before decisions."

## When to use the web app instead

Use the [User Perspective Simulator](https://github.com/yq2664-png/user-perspective-simulator) web app when you want:

- A guided UI through each research step
- Real user voices scraped from the web (G2, Reddit, App Store, etc.)
- Shareable output and export

Use this **skill** when you are working locally, inside a codebase, or want the research workflow embedded directly in your LLM session.

## License

See repository license. Skill content is free to use in your own LLM workflows.
