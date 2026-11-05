---
# folio-assistant-70hd
$schema: bean/1.0.0
title: cat-harness-file checks run only in the repo that commits the files (owner ruling 2026-11-05)
status: in-progress
type: task
priority: high
tags:
    - stalled-pickup-2026-11-05
created_at: 2026-11-05T13:02:05Z
updated_at: 2026-11-05T13:02:05Z
parent: folio-assistant-4j43
---

**Owner ruling, 2026-11-05 ~13:00Z**, verbatim choice: "Move the checks (Recommended)": checks of cat-harness's own files run only in the repo that commits those files, so other layers stop seeing false new failures.

## Evidence
- `check:schema-nodes` judges the harness's own `schemas/` (cat-harness-tools#1478 left two modules untagged; fixed by #1483 / #1485). Every root that mounts the layer ran it, so smart-ra#228's re-pin listed it as a newly failing gate.
- `compare-gates.py` (cat-harness-tools, layer-pr-checks) counts head exit 78 as NEW FAILURE when main ran the gate and passed (or the cone skipped it as unchanged). It is listed, not counted, only when main did not run it.
- The fa re-pin train (`.github/scripts/repin-train.ts`) counts any non-zero item exit, 78 included, as new unless main's record is non-zero too.

## Fix
- `run-gates.py`: a check whose subject is the declaring layer's own committed files is declared in that layer's `package.json` (`ownFilesChecks`); another layer's root skips it as `other-layer` (the kind standalone rehearsals already use), so it is neither run nor counted there. The owning repo's CI still runs it.
- First declared: `check:schema-nodes`.
- A test.

## Done when
- [ ] PR in litlfred/cat-harness-tools merged (green, or only main's own reds)
- [ ] a downstream root lists `check:schema-nodes` as skipped `other-layer`

Parent: 4j43. Related: tsh9 (two-phase move rule), k3vv (CI speed II).
