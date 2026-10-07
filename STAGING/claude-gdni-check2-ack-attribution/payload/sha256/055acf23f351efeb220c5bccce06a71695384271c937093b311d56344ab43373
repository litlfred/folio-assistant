---
# folio-assistant-8fq9
title: 'Placement PR7: tests regroup by concern group, retargeted to cat-harness-tools/'
status: todo
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-01T06:58:01Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-70lx
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR7, ruling 5 (2026-09-30, A): unit tests into `scripts/tests/<group>/`, e2e into `test/<group>/` (≈541 files: sdlc 119, ui 116, kg 109, process 41, library 40, tools 15, conduct 10, content 6, above-harness 85). A test follows the code it tests. **Retargeted by D4 (owner, 2026-10-01, option 3):** stage 1a has moved `scripts/` and `test/` specs, so the destination is `cat-harness-tools/scripts/tests/<group>/` and `cat-harness-tools/test/<group>/`.

Blocked by stage 1a (the paths it regroups move there).

## Done when
- [ ] falsifier: the number of test cases EXECUTED and the passing set are identical before and after, for `bun test` and Playwright
- [ ] `check:ci-invocations`, `check:code-accounting`, `audit:coverage:require-all`, `audit:coverage:strict`, `bat:sync:check` green
