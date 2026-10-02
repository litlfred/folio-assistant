---
# folio-assistant-3hk4
title: QA-PUBLISH must publish real results once main holds none (5hox blocker)
status: todo
type: task
created_at: 2026-10-02T13:58:10Z
updated_at: 2026-10-02T13:58:10Z
parent: folio-assistant-3fva
blocking:
    - folio-assistant-5hox
---

Found by the 5hox prep (2026-10-02, cat-harness/docs/proposals/5hox-removal-inventory.md). qa-publish publishes what the checkout holds under every declared qa directory. After 5hox removes the working copies, a fresh CI checkout holds almost nothing there (only the bootstrap kg-export sidecar), so every main/<sha> entry would hold ~1 file and every --against main baseline would shrink to nothing.

## Do (pick one, the job's own comment names both)
- the gates job hands its working copy to qa-publish as an artifact, OR
- qa-publish runs the QA writers before publishing

## Done when
- [ ] with test/results/ absent from the checkout, a CI run publishes an entry whose file count matches the inventory (1,186 today)
- [ ] qa:verify-moved IDENTICAL against that entry
