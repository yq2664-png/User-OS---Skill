# User Research OS — Skill

Pre-launch user research for your LLM. Simulate how distinct users would react to a product, extract behavioral insights, and turn them into evidence-backed product decisions — before real users ever speak.

**Web app:** [user-perspective-simulator](https://github.com/yq2664-png/user-perspective-simulator)

---

## What this is

This repository contains the **User Research OS skill** — a Markdown workflow you install into Cursor, Claude, or any LLM that supports skills / project instructions.

The skill runs entirely in the model. No API key, no server. You describe a product; the model follows a structured research pipeline with quality bars at every step.

## Install

### Codex (CLI / IDE / ChatGPT desktop)

Codex discovers skills from folders containing `SKILL.md`. This repo ships the skill at the root — install it as a **skill directory**, not as a loose file.

#### Option A — Install from GitHub (recommended)

In a Codex session, ask the installer to pull this repo:

```text
$skill-installer install https://github.com/yq2664-png/User-OS---Skill
```

If the skill does not appear, restart Codex. Then verify with `/skills` or invoke directly:

```text
$user-research-os Do pre-launch user research on [product name].
```

#### Option B — Install manually (global)

Clone the repo and copy the skill into your user skills folder:

```bash
git clone https://github.com/yq2664-png/User-OS---Skill.git
mkdir -p ~/.agents/skills/user-research-os
cp User-OS---Skill/SKILL.md ~/.agents/skills/user-research-os/
cp -R User-OS---Skill/references ~/.agents/skills/user-research-os/
```

Restart Codex if needed. The skill is available in any repo you open.

#### Option C — Install in a project (team-shared)

Check the skill into a repo so everyone on the team gets the same workflow:

```bash
mkdir -p .agents/skills/user-research-os
cp SKILL.md .agents/skills/user-research-os/
cp -R references .agents/skills/user-research-os/
git add .agents/skills/user-research-os
```

Codex scans `.agents/skills` from your current working directory up to the repo root.

#### Using the skill in Codex

| Method | Example |
|---|---|
| Explicit | `$user-research-os How would users react to this onboarding?` |
| Picker | Type `/skills` and select **user-research-os** |
| Implicit | Ask naturally: "Do pre-launch user research on this feature" — Codex matches from the skill `description` |

Keep `references/` next to `SKILL.md`. Codex reads those files when running each phase.

### Cursor

1. Download or clone this repository.
2. Create `.cursor/skills/user-research-os/` in your project (or `~/.cursor/skills/user-research-os/` for global use).
3. Copy `SKILL.md` and the `references/` folder into that directory.

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
  (Insights + Reasoning + UX Findings)
```

| Phase | Output |
|---|---|
| **Perspectives** | 8 user reactions + UX Expert Perspective key findings |
| **Insights** | Ranked behavioral patterns across frustrations, hidden needs, trust issues, and more |
| **Reasoning** | Evidence chains combining user evidence, behavior patterns, and UX findings |
| **Decisions** | 5–6 prioritized product decisions with requirements and success metrics |

There is **one linear path**. Do not skip Insights or Reasoning.

## Repository structure

```
SKILL.md                  # Main skill instructions — install this
references/
  perspectives.md              # Phase 1a — user perspective cards
  ux-expert-perspective.md     # Phase 1b — UX Expert Perspective findings
  insights.md                  # Phase 2
  reasoning.md                 # Phase 3
  decisions.md                 # Phase 4
```

Installed layout for Codex / Cursor:

```
.agents/skills/user-research-os/     # Codex (project)
~/.agents/skills/user-research-os/   # Codex (global)
.cursor/skills/user-research-os/      # Cursor
  SKILL.md
  references/
    ...
```

## Example prompts

- "How would users react to this onboarding flow?"
- "Do pre-launch user research on [product name]."
- "What friction and trust issues does this feature have?"
- "Run the full User Research OS workflow through decisions."

## When to use the web app instead

Use the [User Perspective Simulator](https://github.com/yq2664-png/user-perspective-simulator) web app when you want:

- A guided UI through each research step
- Real user voices scraped from the web (G2, Reddit, App Store, etc.)
- Shareable output and export

Use this **skill** when you are working locally, inside a codebase, or want the research workflow embedded directly in your LLM session.

## License

See repository license. Skill content is free to use in your own LLM workflows.
