---
title: "The tool graph"
nav_order: 41
description: "What a Tool is, how it differs from a skill, and how the two are joined without being conflated."
documents:
  - cat-harness/tools
---

# The tool graph

{: .fs-6 .fw-300 }
A **Tool** is one concrete way to exercise a capability. A **skill** states
that capability generically. They are two graphs, and this page is about the
first one.

[Browse the 69 tools](tools/){: .btn .btn-primary }

---

## One sentence, and every word in it is a different object

> **An actor performs a task in a process as a role, using that role's skills —
> and a tool is one concrete way to exercise one.**

The first half is the [role model](skills.md). This page is the last clause.

| | what it is | authored as |
|---|---|---|
| **Skill** | the instruction body an actor reads — what you need to *know* | markdown in the `kg` graph |
| **Tool** | one way to *do* it — an installation, an invocation, typed inputs and outputs | TypeScript calling `defineTool` |

A skill may be satisfied by several tools. A tool may satisfy several skills.
Neither contains the other.

## The relation is `satisfies`, and it has a direction

A Tool node carries `satisfies`, naming the skills it is a way of exercising.
The arrow runs **from a tool to a skill** and never back:

```
tool  --satisfies-->  skill
```

That direction is the whole of keeping them apart. Read tool-to-skill it says
*"this is one way to do that"*. Reversed, it would say *"this skill is a
tool"*, which is false and is the conflation the owner named on 2026-09-21:

> keep tools and skills separate!

A skill therefore does **not** list its tools. Asking "what can exercise this
skill?" is a query over the tool graph, not a field on the skill — because the
answer changes when a tool is added, and a skill that had to be edited for
that would be a skill whose correctness depended on the tooling around it.

## Why this page exists at all

The `tools` entry in `cat-harness.json` declared
`coverage.docs: "cat-harness/docs/skills.md"` until 2026-09-22 — a page titled
*"Skills & roles"*, whose headings are Skills, Roles, and Capabilities &
requirements. There was **no tools section in it**. The tools graph had no
documentation of its own and pointed at a page about something else.

That is worse than an absent reference, and the reason generalises:

> An absent `docs` ref is a legible gap. A ref that **resolves** reports
> coverage.

The check in force asks only whether the declared path exists. It did. So
nothing ever flagged it, and every consumer that counts documented graphs
counted this one. It is `pb04` — *a dead link is worse than no link* — one
level up, where the link is not dead at all and simply points somewhere else.

## Authored as TypeScript, on purpose

Tool nodes are `.ts` calling `defineTool`, not JSON. A malformed node fails at
`tsc` and in the editor rather than at CI, and the JSON-LD and JSON Schema
renderings are generated from them.

This is why the [generated view](tools/) *imports* the graph rather than
parsing the source. A generator that re-read the files would be a second,
weaker reader of them — free to disagree with the one the server uses, and
with no type checker behind it.

## What the generated page reports

Beyond the census, two questions it answers rather than assumes:

**Does every `satisfies` name a skill that exists?** A dangling one is a tool
advertising a capability the graph cannot locate. The page states the answer in
both directions — "all resolve" is printed, not merely implied by the absence
of a warning, because *nothing unresolved* and *the check did not run* are
different facts.

**Does any tool satisfy nothing?** A separate gap: the tool exists and nothing
says what capability it is a way of exercising.

## See also

- [Skills & roles](skills.md) — the other graph, and the role model
- [`skills-and-tools`](reference/skill-instructions/skills-and-tools.md) — the
  governing skill, which is where the discipline lives rather than here
