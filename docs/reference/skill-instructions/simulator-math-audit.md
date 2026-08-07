---
layout: default
title: Simulator Math Audit
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/simulator-math-audit.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/simulator-math-audit.md) — do not edit here.

{% raw %}
# Simulator Math Audit

## Role

Ensure every simulator in the folio accurately reflects the mathematics
it claims to visualise, and that it derives its numbers rather than
restating them.

> Recovered from a migration that lost its payload: qou carried a stub
> pointing at a folio-assistant path that never existed. Restored here
> and generalised — the original hardcoded one folio's compute substrate
> and constants.

## Instructions

1. **Identify simulators.** Locate blocks with `kind: "simulator"` under
   `content/` and their corresponding `.html` visualisations. See the
   `simulator` skill for the content-object shape.

2. **Cross-reference the math.** For each simulator, find the formal
   blocks it visualises — the propositions, theorems, and equations in
   its `uses[]` and in the surrounding narrative. Note that `uses[]` is
   the *editorial* relation; if the simulator has a `lean.ref`, the
   formal dependencies are in the content graph
   (`content/pipeline/content-graph.ts`).

3. **Verify formulas and constants.**
   - Check each displayed formula against the block that defines it.
   - Check computed quantities against the Lean formalisation and the
     LaTeX/Markdown statement.
   - **CRITICAL — no hardcoded constants.** Every physical or
     mathematical constant, and every formula, MUST be referenced
     dynamically from the folio's compute substrate or imported from the
     paper's canonical source. A simulator is part of the compute side
     of the repository, not a separate re-implementation.

     A hardcoded constant is a silent divergence: the paper's value can
     be corrected and the simulator will keep showing the old one, with
     nothing failing. Treat any literal numeric constant in a simulator
     as a finding unless it is a pure display parameter (canvas size,
     frame rate, colour).

     Resolve the substrate from the folio rather than assuming a package
     name — check the folio's `computations/` (or its configured compute
     root) and the simulator's own imports.

4. **Report deviations.** Record findings in the block's `.qa.json`
   sidecar so they travel with the content and are visible to the
   watchers, rather than in a free-standing report.

5. **Coordinate.** Use `beans` for cross-agent work (see
   `bean-coordination`); claim before you work. For a large sweep,
   `dispatch-agent` handles fan-out with a progress contract.

## Interaction with other skills

| Skill | Interaction |
|---|---|
| `simulator` | Owns authoring/config of simulator content objects |
| `compute-audit` | The same question for computation scripts |
| `witnessed-values` | Canonical values a simulator should be reading |
| `content-graph` | Resolves what a simulator actually depends on |
{% endraw %}
