---
# folio-assistant-61n5
title: qa-results parity test fails intermittently under bun run gates (2 of 4 local runs), never alone or in CI
status: todo
type: bug
created_at: 2026-09-23T07:09:46Z
updated_at: 2026-09-23T07:09:46Z
parent: folio-assistant-zzmr
---

The test "every family in the committed result matches the export's own field" in cat-harness/scripts/tests/qa-results.test.ts failed in 2 of 4 local `bun run gates` runs on 2026-09-23, on diffs that don't touch kg-export (the a1lq and 423d work). It passed 3 of 3 plain `bun test` runs, passes when run alone, and passed in CI every time.

It compares the committed kg-export.qa-results.json against a live buildExport(), so something that scans the repo is seeing transient state. Candidates:
- a gate step that runs before `bun test` and writes into the repo;
- a test that makes fixtures INSIDE the repo while bun runs files concurrently, for example cat-harness/schemas/harness-config.test.ts writes cat-harness/schemas/__test_folio_config__/.

## Done when
- [ ] the failing diff is captured from a failing gates run
- [ ] the root cause is fixed deterministically; the test is never skipped or quarantined
