---
# folio-assistant-08u4
title: 'SURVIVAL PATH: every referenced IRIS node resolves by Handle, with a liveness check and a snapshot pointer'
status: completed
type: task
priority: high
created_at: 2026-09-24T18:01:44Z
updated_at: 2026-09-30T08:26:13Z
parent: folio-assistant-kupb
---

From the `v048` roast, objections 6 + 7. Placed under `kupb` by the owner, 2026-09-24.

**Measured:** every catalogue node id is a DSpace UUID or a path, and every upstream URL is `iris.who.int/…`. `hdl.handle.net` occurs **0** times in `who-iris/catalogue`, against `iris-dspace.md` R1: *"Resolve by **Handle** where one exists… only the Handle is guaranteed outside WHO"*. No step in `sample-import.bpmn` or `materialize-remote.bpmn` checks that a source is still there; nothing reads `provenance.upstream` for liveness; and no snapshot or Wayback pointer exists. Referenced nodes (10 of 13) may not carry gates (`materialization.ts:467`), so their `sourceLoss` is never asked. The owner's own question was *"what happens if data source goes away"*.

## Done when
- [x] every node with a Handle records it as a resolvable `https://hdl.handle.net/…` IRI, preferred over the host URL
- [x] a liveness check exists (it may report *could not determine* where egress is blocked, never "live") and is wired into the process
- [x] what happens on source loss is stated per node kind (a snapshot pointer, or an explicit "lost with the source"), not only for bytes already copied

_2026-09-30T00:13:50Z_ — Claimed by claude/magical-archimedes-4qkfxp-08u4 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Landed in PR #1528.
- `HandleSchema`, `handleIri`, `handleFromUrl` and `resolvableIri` in `folio-assistant-core/schemas/catalogue.ts`. The three items carry their Handle, and `resolvableIri` prefers it over the host URL.
- `check-catalogue.ts` check 5 compares a node's Handle with the Handles in its upstream URLs and record, in both directions (mutation-tested). Check 6 requires a `sourceLoss` statement.
- `sourceLoss` in `who-iris/catalogue/catalogue.json` states source loss per node kind: container, referenced item and materialized item.
- `bun run sources:liveness` (`source-liveness.ts`, 11 tests) reports three states per node, plus a Wayback snapshot probe. "Could not determine" exits 2 and is never live.
- `refresh-materialized.bpmn` Task_Upstream names the check, and `sample-import-run.ts`'s Task_Fetch records a liveness probe of the Handle IRI.
- The item pages now link through hdl.handle.net.
