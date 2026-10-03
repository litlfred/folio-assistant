---
# folio-assistant-0utt
title: 'PRODUCER: kg-export.bootstrap.qa-results.json is read by check:published-instance-exports but produced by no workflow'
status: todo
type: task
priority: normal
created_at: 2026-10-01T09:30:19Z
updated_at: 2026-10-01T09:30:19Z
parent: folio-assistant-3fva
---

Found by the r7v6 agent (C2 fix, 2026-10-01). The C2 gate now actually compares the committed `cat-harness/test/results/kg-export.bootstrap.qa-results.json` with a fresh re-export. On its first run it found the file stale (different producer hash, untagged modules 0→3), and the file was refreshed by hand in `ba1908fa`.

**Owner ruling 2026-10-01:** keep the file and add a producer. Do not delete it.

Note that `bo44` changes `kg-export.ts`, which changes the producer hash, so this file must be regenerated when bo44 lands. Under arc 3fva the file moves to the qa-reports branch, so the producer is the CI publish step (`16ei`). Until then it is the workflow step that runs the export.

## Done when
- [ ] a workflow step (or the 16ei publish job) regenerates it on every main push
- [ ] `check:published-instance-exports` names that producer, and no longer reports 'no workflow producer'
- [ ] regenerated after bo44's kg-export.ts change
