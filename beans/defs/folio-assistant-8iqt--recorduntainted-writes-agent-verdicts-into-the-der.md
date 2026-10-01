---
# folio-assistant-8iqt
title: recordUntainted writes agent verdicts into the DERIVED block-qa file, not the attestation store
status: todo
type: bug
priority: normal
created_at: 2026-10-01T19:22:21Z
updated_at: 2026-10-01T19:22:21Z
parent: folio-assistant-3fva
---

Found by the d6bw agent, 2026-10-01.

`recordUntainted` (the untainted-verification writer) still writes an agent verdict into the derived block-qa report. Since 8wj1/2gst, judgements live in the declared `attestations` graph (`test/attestations/`, `qa-attestations/v1`). The verdict reaches the store only when a later writer runs and auto-moves it (owner ruling 2). So nothing is lost today. But once bean `5hox` removes derived files from main, a verdict written into a derived file that is never published or moved would be lost.

## Done when
- [ ] `recordUntainted` writes through the attestation store API, like the 9 writers 8wj1 fixed
- [ ] a test: with the derived file absent, a recorded untainted verdict lands in the store
- [ ] lands before `5hox`
