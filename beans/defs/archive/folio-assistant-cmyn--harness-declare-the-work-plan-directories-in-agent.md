---
# folio-assistant-cmyn
title: 'HARNESS: declare the work-plan directories in agent-harness.json, not harness.config.json'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:55:26Z
updated_at: 2026-09-18T17:55:26Z
---
## What

The work-plan directories were declared twice: a `harness` block in
`harness.config.json` (merged in #255) and, properly, nowhere. `agent-harness.json`
is where an instance declares the directories it scans and the KIND of graph each
holds — which is what the author asked for originally.

Added two graph kinds to the harness's own table:

- `workplan` — `beans/`, what is being worked on
- `process` — `beans/workflow/`, where each running BPMN instance got to

Two kinds rather than one because they are nested and easy to conflate: a
consumer asking for the work plan must not be handed token markings.

Harness-layer rather than core, and the test is different from the one that sent
`folio` to core. `folio` went to core because only core can RENDER. The work plan
is the harness's because the harness HAS one.

`HarnessDirsSchema` deleted; `check:harness-dirs` now reads the declaration.
One declaration, still cross-checked against `.beans.yml` which the third-party
CLI reads.

## Summary of Changes

schemas/agent-harness.ts (two kinds), agent-harness.json (two directories +
a nesting note), schemas/harness-config.ts (block removed), check-harness-dirs.ts
(reads the declaration), directory-conventions.md, AGENTS.md, and the sibling's
agent-harness.test.ts assertions updated from three kinds to five while keeping
their intent — none renderable, `folio` unknown to a bare registry.
