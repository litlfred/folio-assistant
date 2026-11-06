---
# folio-assistant-veb9
$schema: bean/1.0.0
title: 'cat-harness-tools: adversarial-backfill.ts resolveSidecarPath still uses the pre-#1014 path'
status: in-progress
type: bug
priority: normal
tags:
    - qa
created_at: 2026-11-05T17:24:23Z
updated_at: 2026-11-06T05:55:20Z
parent: folio-assistant-rwmf
---

`resolveSidecarPath` in cat-harness-tools `adversarial-backfill.ts` still maps a skill to `kg-qa/skills/sdlc/sdlc-core/`. Since #1014 the store has been at cat-harness `test/attestations/adversarial-review/sdlc/skills/sdlc-core/<name>.attestations.json`.

As a result:
- `--rank` reports reviewed sdlc skills as "never" reviewed;
- the write path would create orphaned files.

Found during the owner-approved re-review of `merge-conflict-patterns`.

## Fix
Derive the path from the same source that `adversarialCoverageByGraph` (`scripts/audit-coverage.ts`) reads, and add a test.

## Done when
- [x] `--rank` shows a reviewed sdlc skill as reviewed
- [x] a test fails on the old path and passes on the derived one

_2026-11-05T17:21:52Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the CI-speed parent session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-06T05:39:19Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-06T05:55:20Z_ — PR opened: https://github.com/litlfred/cat-harness-tools/pull/1568 (`agy/bean-veb9-adversarial-backfill`). Derived skill sidecar directory from `storedAdversarialReviews` (matching `adversarialCoverageByGraph` in `scripts/audit-coverage.ts`) and `node.path` via `kgQaSidecarPath`, and added unit test in `scripts/tests/adversarial-checklist.test.ts`.
