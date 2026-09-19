<!-- Generated from skills/memory/qa-sidecars.md by `bun run agent-memory`. -->
<!-- Not injected into MEMORY.md; read on demand. Edits here are lost. -->

A sidecar is **stale** when the recorded source hashes or a reviewer
`script_hash` drift from the current file contents. Refresh by deleting the
stale `criteria.<crit>` entry and re-running
`bun run content/pipeline/qa-sweep.ts <path> --only <crit>`.

**A standalone library `.lean` file has no sidecar** and escapes every
per-block checker. Nothing but an agent checks it.
