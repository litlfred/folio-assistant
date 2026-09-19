<!-- Generated from skills/memory/block-verdicts-moved-to-the-results-tree.md by `bun run agent-memory`. -->
<!-- Not injected into MEMORY.md; read on demand. Edits here are lost. -->

`content/pipeline/qa-paths.ts` is the contract:

- **read** → `existingBlockQaPath(repoRoot, blockRoot)` — results tree first,
  legacy sibling second, `undefined` ONLY when there is genuinely no verdict.
- **write** → `blockQaPath(repoRoot, blockRoot)` — results tree only. Writing
  the legacy location too creates two verdicts for one block that can
  disagree, with nothing saying which is current.
- **invert** → `blockOfQaPath(repoRoot, qaPath)`, which `no-orphan-sidecar`
  depends on to find the manifest a verdict belongs to.

`repoRoot` is the CONTENT repo root (`findContentRepoRoot()`), never the
platform checkout.

The legacy fallback is not politeness. A downstream folio has its verdicts
committed beside its blocks; a reader that consults only the results tree
reports every block in that folio as unaudited the day it upgrades.

`saveQaReport` mkdirs, because the mirrored directory is not guaranteed to
exist — the legacy sibling's always did, being the block's own. Bean `2634`.
