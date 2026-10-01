---
# folio-assistant-rmi6
title: 'C1: flip cat-harness-tools needs to [cat-harness, bootstrap-tools]; core adds cat-harness-tools'
status: in-progress
type: task
priority: high
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-01T13:19:50Z
parent: folio-assistant-7x5n
blocked_by:
    - folio-assistant-hx65
---

Owner ruling C1 (2026-10-01): tools sit below core. Placement audit: 0 of cat-harness-tools' 27 files import core, so only declarations change (cat-harness-tools.json needs; folio-assistant-core.json needs += cat-harness-tools) plus artefacts that read needs.
## Done when
- [ ] declarations changed; import-direction / reference-direction green; gates green; merged

_2026-10-01T13:19:50Z_ — Claimed by claude/blissful-ride-c2f26u-c1-tools-below-core — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
