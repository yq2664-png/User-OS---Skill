---
name: user-os-context
description: Generate a structured product-context document for an unpublished or local/code-based project, ready to paste into User Research OS. Use when the user wants to simulate user perspectives for a product that isn't live on the web yet.
---

# User OS — Context Generator

This skill turns a local project (a codebase, a design doc, a rough idea) into a
clean **product-context document** you can paste straight into the *Context* field
of [User Research OS](https://github.com/yq2664-png/User-OS---Skill).

User Research OS simulates how multiple distinct users would think about your
product *before* you ship. For unpublished or local projects there's no live URL
to scrape, so the model needs you to describe the product. This skill writes that
description for you, in the exact shape the simulator works best with.

## When to use

- The user has a **local or code-based project** (a repo, a Figma export, a spec).
- The product is **not yet live on the web**.
- The user says things like "generate context for User Research OS", "describe my
  product for the simulator", or pastes a folder / file and asks for a product brief.

## What to produce

Read whatever the user gives you — source files, README, design docs, screenshots,
or a verbal description — and write a single Markdown block with these sections:

```
## Product
<one-line name + what it is>

## Core functions
- <function 1: what the user can do>
- <function 2>
- <function 3>
(3–6 bullets, behaviour-focused, not implementation detail)

## Target users
<who this is for — roles, contexts, and the job they're hiring the product to do>

## The problem it solves
<the underlying pain, stated as the user would feel it>

## Known constraints / open questions
<anything that shapes the experience: platform, pricing model, missing features,
parts you're unsure about>
```

## How to do it well

1. **Read before you write.** If given a repo, look at the README, the main entry
   points, routes/screens, and any `docs/` or `design/` folder. If given a single
   file, read all of it.
2. **Describe behaviour, not code.** "Users can draft a doc and share a link"
   beats "exposes a POST /share endpoint". The simulator reasons about people.
3. **Stay concrete.** Name real features and real audiences. Avoid "powerful",
   "intuitive", "seamless" — they carry no signal for perspective simulation.
4. **Surface friction.** The most useful context names where the product is rough,
   risky, or unclear. That's exactly what the simulator needs to find pain.
5. **Output the Markdown block only** — the user will paste it directly. No
   preamble, no "here's your context".

## After generating

Tell the user:
> Paste this into the **Context** field on the Unpublished tab of User Research OS,
> then click *Generate User Perspectives*.
