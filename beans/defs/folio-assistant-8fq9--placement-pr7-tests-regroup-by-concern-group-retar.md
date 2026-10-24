---
# folio-assistant-8fq9
$schema: bean/1.0.0
title: 'Placement PR7: tests regroup by concern group, retargeted to cat-harness-tools/'
status: todo
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-24T08:12:00Z
parent: folio-assistant-iirv
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR7, ruling 5 (2026-09-30, A): unit tests into `scripts/tests/<group>/`, e2e into `test/<group>/` (≈541 files: sdlc 119, ui 116, kg 109, process 41, library 40, tools 15, conduct 10, content 6, above-harness 85). A test follows the code it tests. **Retargeted by D4 (owner, 2026-10-01, option 3):** stage 1a has moved `scripts/` and `test/` specs, so the destination is `cat-harness-tools/scripts/tests/<group>/` and `cat-harness-tools/test/<group>/`.

Blocked by stage 1a (the paths it regroups move there).

## Done when
- [ ] falsifier: the number of test cases EXECUTED and the passing set are identical before and after, for `bun test` and Playwright
- [ ] `check:ci-invocations`, `check:code-accounting`, `audit:coverage:require-all`, `audit:coverage:strict`, `bat:sync:check` green

_2026-10-16T06:55:00Z_ — Block lifted: `70lx` is completed. Owner ruling 2026-10-16 06:50Z (question 4, option 1): the part-by-part measurement stands in for `bun run cat gates --all` and for falsifier 2, so 70lx is closed. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured: not started. `cat-harness-tools/scripts/tests/` is flat (773 files, no concern-group folders) and `cat-harness-tools/test/` is flat too.

## OWNER, 2026-10-24 08:06Z (structured question in the separation drain thread, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

**"Do them now, one at a time ... in groups so not so much churn"** (option A). One PR per concern group (sdlc, ui, kg, process, library, tools, conduct, content, above-harness), each its own merge, rather than one ~770-file move.
