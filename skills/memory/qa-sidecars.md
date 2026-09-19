---
$schema: folio-memory/v1
id: qa-sidecars
label: stable
summary: "QA sidecars"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
`<block>.qa.json` (block-qa/v1) carries per-criterion reviewer entries;
`<criterion-id>.script.json` is qa-script/v1. Producing types are
`schemas/block-qa.ts`. A sidecar is **stale** when the recorded source hashes
or a reviewer `script_hash` drift from the current file contents; refresh by
deleting the stale `criteria.<crit>` entry and re-running
`bun run content/pipeline/qa-sweep.ts <path> --only <crit>`.

`qa-staleness.ts` reports; `qa-sweep.ts` repairs.

**A standalone library `.lean` file has no sidecar** and escapes every
per-block checker. Nothing but an agent checks it.
