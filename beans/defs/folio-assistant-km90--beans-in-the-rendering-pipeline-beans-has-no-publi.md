---
# folio-assistant-km90
title: 'BEANS IN THE RENDERING PIPELINE: beans/ has no published projection and no visualiser, while todos/ has both'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T18:10:25Z
updated_at: 2026-09-20T18:47:24Z
parent: folio-assistant-yj32
---

The buildable half of v49e. Measured 2026-09-20: todos/ has a reader module, a published index at docs/assets/todos/index.json and a board over it; beans/ has none of the three, though 239 bean files carry status, type, parent and priority. v49e's headline join needs beans/workflows/, which is EMPTY, so the BPMN-position view has no data on one side. This bean builds the half whose data exists.

## Done so far — three pushes, PR #581

1. **The reader and the projection.** `scripts/beans.ts` is the one bean
   reader; `check-bean-parents.ts` imports it and `beanFile()` resolves the
   defs directory from `beans/beans.json` rather than composing `beans/defs`.
   `docs/assets/beans/index.json` is published under the same `--check`
   contract as the todo index.

2. **The dashboard.** Counts, open beans by epic, and what is stuck. Three
   findings computed from committed data only; a stale-`in-progress` detector
   is deliberately absent because the emit is content-gated and a clock-derived
   finding would fire the staleness gate forever. The page computes age.

3. **The state visualiser**, `<base>/<stub>/state-visualizer/` per
   instantiated harness, per the owner's routing rule. Which graphs appear is
   read from each instance's own declaration — `holds: "state"` — never listed
   in the generator.

## What rendering it caught that nothing else did

YAML single-quoted front matter writes an apostrophe as two, and stripping
only the outer quotes published *"the knowledge graph''s own structure"*. 239
of 239 titles now unescape correctly. The committed docs projection carried
the defect too.

Two repository gates caught two more: a hardcoded `docs` site root, and
`state-visualizer.ts -> scripts/todos.ts`, the harness reaching up into core.
The second was fixed by ownership rather than exemption.

## Still open

- [ ] `beans/workflows/` is empty, so where a bean sits in a BPMN process
      cannot be shown. That is `v49e`'s other half and it waits for instance
      state to exist.
- [ ] `qa`, `health`, `issue-marks` and `uploads` are declared state graphs
      with no reader. Their pages say so and name `2krx`.
