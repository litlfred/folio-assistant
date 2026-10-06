---
# folio-assistant-rmi6
title: 'C1: flip cat-harness-tools needs to [cat-harness, bootstrap-tools]; core adds cat-harness-tools'
status: completed
type: task
priority: high
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-01T13:19:53Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-hx65
---

Owner ruling C1 (2026-10-01): tools sit below core. Placement audit: 0 of cat-harness-tools' 27 files import core, so only declarations change (cat-harness-tools.json needs; folio-assistant-core.json needs += cat-harness-tools) plus artefacts that read needs.
## Done when
- [x] declarations changed; import-direction / reference-direction green; gates green; merged

## Evidence (PR #1786, branch claude/blissful-ride-c2f26u-c1-tools-below-core)

- `cat-harness-tools.json` needs `[folio-assistant-core]` -> `[cat-harness, bootstrap-tools]`; `folio-assistant-core.json` needs += `cat-harness-tools`. Nothing hardcodes the order: every reader derives it from `needs` (`allowedFromNeeds`, `layer-direction.ts`, instance graph, harness tiles); no layer table needed editing.
- `check:instance-graph`: before ✓ 18 instances, no cycle; after ✓ 18 instances, no cycle.
- `check:import-direction`: before 0 wrong-direction in every instance (cat-harness-tools 14 files, folio-assistant-core 84); after 0 wrong-direction in every instance (same file counts). Exit 0 both.
- `check:reference-direction` (advisory, not in CI): wrong-direction before 1702 occurrences / 389 files, after 1699 / 388. Pair `folio-assistant-core -> cat-harness-tools` 2 -> 0 (now the allowed direction); `cat-harness -> cat-harness-tools` 72 -> 71; no new `cat-harness-tools -> *` pair (the flip would have made 3 to core, 3 to sci, 1 to fhir-harness — tools-layer prose reworded so it does not name the layers above it). Unlisted multi-destination files 132 -> 131. After merging main (#1776, S4): 1672 wrong-direction / 379 files, 124 unlisted; still no `cat-harness-tools -> *` or `folio-assistant-core -> cat-harness-tools` pair. It exits 1 both before and after on the PRE-EXISTING PENDING backlog (4 stale entries, 131 unlisted files) — issue #1219 / bean zhg2's question, not this bean's; gates.ts carries it as advisory for exactly that reason.
- `bun run regen`: 82 current, 1 regenerated (docs:harness), 0 unrepaired.
- `bun run gates`: see PR #1786 body for the run.
