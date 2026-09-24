---
# folio-assistant-cw35
title: 'GATES DECIDE PUBLICATION: a held bitstream whose copyright or restrictions gate is not permitted is not redistributed'
status: todo
type: task
priority: high
created_at: 2026-09-24T18:01:44Z
updated_at: 2026-09-24T18:01:44Z
parent: folio-assistant-kupb
---

From the `v048` roast, objections 3 + 4. The owner placed this under `kupb` on 2026-09-24, knowing it keeps GOAL 3 open.

**Measured:** every held bitstream carries `copyright: unknown` and `restrictions: unknown`, yet the public who-iris pages link the PDFs via raw.githubusercontent and jsDelivr. `gen-iris-pages.ts` reads gates only to COUNT them (l.1062). `refusedGates` / `unansweredGates` (`folio-assistant-core/schemas/materialization.ts`) are called only from `remote-content.test.ts`. `materialize-remote.bpmn:45` says "`unknown` on any single gate is enough to keep the node `referenced`", yet all 3 items are `materialized`.

## Done when
- [ ] the page generator links a held bitstream only when its copyright and restrictions gates are `permitted`; otherwise it shows the item as referenced, and says why
- [ ] a check fails when a node is `materialized` with any gate `unknown` or `refused` (the process's own rule, now enforced)
- [ ] the three items' gates are answered from the source (the WHO licence on each record), or the items revert to `referenced`; whichever, it is a decision with its evidence, not a default
