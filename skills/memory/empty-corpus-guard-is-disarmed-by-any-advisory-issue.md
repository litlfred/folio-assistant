---
$schema: folio-memory/v1
id: empty-corpus-guard-is-disarmed-by-any-advisory-issue
label: trap
summary: "validateObjects detects 'validated nothing' via issues.length === 0, so any advisory issue turns invalid into valid"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
`validateObjects` refuses success over a corpus it read nothing from, detected
as `allBlocks.size === 0 && issues.length === 0`. **Any** issue raised in
`loadBlocksFromDir` disarms it — including a warning that a check could not run.

Measured 2026-09-19: a third-state notice on `no-orphan-sidecar` flipped "an
empty directory is INVALID" to `valid: true`. Suppressed there; the fragility
remains for the next check that adds an advisory issue.
