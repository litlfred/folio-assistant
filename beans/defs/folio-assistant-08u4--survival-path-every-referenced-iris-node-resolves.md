---
# folio-assistant-08u4
title: 'SURVIVAL PATH: every referenced IRIS node resolves by Handle, with a liveness check and a snapshot pointer'
status: todo
type: task
priority: high
created_at: 2026-09-24T18:01:44Z
updated_at: 2026-09-24T18:01:44Z
parent: folio-assistant-kupb
---

From the `v048` roast, objections 6 + 7. Placed under `kupb` by the owner, 2026-09-24.

**Measured:** every catalogue node id is a DSpace UUID or a path, and every upstream URL is `iris.who.int/…`. `hdl.handle.net` occurs **0** times in `who-iris/catalogue`, against `iris-dspace.md` R1: *"Resolve by **Handle** where one exists… only the Handle is guaranteed outside WHO"*. No step in `sample-import.bpmn` or `materialize-remote.bpmn` checks that a source is still there; nothing reads `provenance.upstream` for liveness; and no snapshot or Wayback pointer exists. Referenced nodes (10 of 13) may not carry gates (`materialization.ts:467`), so their `sourceLoss` is never asked. The owner's own question was *"what happens if data source goes away"*.

## Done when
- [ ] every node with a Handle records it as a resolvable `https://hdl.handle.net/…` IRI, preferred over the host URL
- [ ] a liveness check exists (it may report *could not determine* where egress is blocked, never "live") and is wired into the process
- [ ] what happens on source loss is stated per node kind (a snapshot pointer, or an explicit "lost with the source"), not only for bytes already copied
