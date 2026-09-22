---
# folio-assistant-d903
title: 'DIFF RENDERERS: a registry of per-block-kind renderers the reviewer selects — word, inline, side-by-side, DAK-structural, visual'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:54Z
updated_at: 2026-09-22T21:04:32Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
---

Owner: *"select different diff rednerers/viz"*.

**What.** A renderer registry, declared as DATA: `{ id, label, appliesTo:
block kinds, input: ChangeSet entry }`. The review page offers a selector per
block, plus a default per kind. Candidate renderers, cheapest first:

1. **word diff of the source prose**: `<ins>`/`<del>`, no rendering needed.
2. **inline rendered diff**: the rendered HTML of both sides, with changes
   highlighted in place.
3. **side-by-side**: MAIN and STAGING in two synced panes, scrolled to the block.
4. **structural diff for DAK artefacts**: a decision-table row, a data element,
   an indicator or a FHIR profile element compared as fields, not as text.
5. **visual/pixel diff**: screenshots overlaid, for figures, diagrams and
   tables whose markup diff is meaningless.

**Measured.** The repo has **no** diff library today (no htmldiff,
diff-match-patch or pixelmatch). Adding one is a dependency decision, and
NOTICE / THIRD-PARTY-NOTICES must follow.

**Why a registry.** A single "the diff" gets it wrong for at least one block
kind. The DAK structural case is the proof: a text diff of a decision table is
unreadable.

## Done when
- [ ] the registry schema is in folio-assistant-core/schemas, and renderers are chosen per block kind
- [ ] renderers 1–3 are shipped; 4 and 5 are each a child bean or scrapped with reasons
- [ ] the choice persists per viewer (localStorage, wrapped in try/catch) and the page works without it


## Roast correction 2026-09-22 (epic q4jm, R5)

The registry describes rendering tools, so its schema goes in **cat-harness/schemas**, not folio-assistant-core (core AGENTS.md: skills, workflows, roles and tools schemas belong in the harness). The review page JS is its own module, **not** added to docs-ui.js (R8).
