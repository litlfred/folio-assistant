# AGENTS.md — folio-assist-core

This directory is a **staged instance**, not a repository yet. The agent
guidance that governs work here is the root
[`AGENTS.md`](../AGENTS.md); everything it says about beans, briefs, process
state and continual progress applies unchanged.

What is specific to this layer, and it is one rule:

> **Core owns content vocabulary; the harness owns the harness.**
> A schema describing what a folio HOLDS, where it CAME FROM, or how much of it
> is actually PRESENT belongs here. A schema describing skills, workflows,
> roles or tools belongs in `cat-harness/`.

The line is not stylistic. `BASE_GRAPH_KINDS` in
`cat-harness/schemas/cat-harness.ts` records the owner's own phrasing of it, and
`schemas/folio-graph-kind.ts` shows what goes wrong when a layer owns a kind it
cannot serve.

**Before adding anything here**, read [`README.md`](README.md) — in particular
the three materialisation states, which have no default and are checked rather
than assumed.
