---
# folio-assistant-2lzp
title: atomic-mass-gen-check.yml is qou folio residue in the platform repo — move it to litlfred/qou
status: todo
type: task
priority: low
created_at: 2026-09-24T17:30:18Z
updated_at: 2026-09-24T17:30:18Z
parent: folio-assistant-vke6
---

## Why
`.github/workflows/atomic-mass-gen-check.yml` checks `content/quantum-observable-universe/lean/…`, which is not in this repository since the split. Its only live trigger here is an edit to the workflow file itself, and then it failed on a missing script (seen on PR #1284, which added its `# bpmn:` line). #1284 made the missing generator a stated "not applicable" notice rather than a red job.

## Done when
The workflow (and `atomic-mass-drift-check.bpmn`, if the diagram goes with it) lives in the qou folio, and this repo no longer carries it. The owner asks before any PR in the math repo.
