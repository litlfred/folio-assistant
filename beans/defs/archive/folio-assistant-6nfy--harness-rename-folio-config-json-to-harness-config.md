---
# folio-assistant-6nfy
title: 'HARNESS: rename folio.config.json to harness.config.json, one resolver, legacy fallback'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:33:26Z
updated_at: 2026-09-18T17:39:02Z
---
## What

The file configures the HARNESS — adapter selection, skills dir, viewer,
simulators, translation, and the two work-plan stores — not the folio's content.
`folio.config.json` named the wrong thing.

Renamed to `harness.config.json`. `schemas/folio-config.ts` ->
`schemas/harness-config.ts`, and the symbols with it (`FolioConfig` ->
`HarnessConfig`, `readFolioConfig` -> `readHarnessConfig`,
`FolioConfigSchema` -> `HarnessConfigSchema`).

## The part that mattered

The path was built at ELEVEN independent sites. A legacy fallback written
eleven times diverges at ten of them, and the one that forgets is the one a
folio silently stops being configured by. All eleven now go through
`resolveHarnessConfigPath()`, which is the only place that knows both names.

Legacy `folio.config.json` is still read — every existing folio has one — with
a note printed once per directory, not once per read.

## Done when

tsc, lint, 1650 tests, and the five new fallback tests green; every reference
swept; `check:harness-dirs` honours a legacy config rather than falling back to
schema defaults.

_2026-09-18T17:39:02Z_ — Hard break on author's instruction: folio.config.json is no longer read at all, and .folio/ became .harness/.
