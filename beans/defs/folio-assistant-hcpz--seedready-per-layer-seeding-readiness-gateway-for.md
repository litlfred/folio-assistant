---
# folio-assistant-hcpz
title: seed:ready — per-layer seeding readiness gateway for kg-separation (Source settled?)
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T17:22:19Z
updated_at: 2026-10-02T22:27:27Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-02: 'seed:ready: check skills/process to harness / KG separation and align.' The steward applied stability criteria by hand before a seeding review (heavy-mover PRs landed; no open PR touches the next layer; at most 5 touch the layer; none moves files in it). This bean makes that a DMN-backed gateway in kg-separation.bpmn, evaluated by bun run seed:ready --layer <name>, reading the layer map from the instance declarations. Serves S7 mgxw and S3 ga6u.

## Done when
- [ ] survey of existing readiness definitions recorded in the PR
- [ ] decisions/seed-readiness-gate.dmn + gateway in kg-separation.bpmn
- [ ] cat-harness/scripts/seed-ready.ts reports pass/fail/could-not-determine per criterion; never seeds
- [ ] unit tests with fixtures
- [ ] kg-separation skill text updated; skill:register, render:bpmn, kg:audit:check, gates green

## Handover (2026-10-02)

## Where this is going

`seed:ready` answers whether a staged layer's source has settled enough to seed, at seed time. Its answer drives a DMN-backed gateway, `GW_SeedReady` ("Ready to seed?"), which `kg-separation.bpmn` now places between *Create the repositories* and *10 · Seed*. The criteria are the steward's hand-applied ones, generalised per layer and read off the instance declarations, with every threshold in `seed-readiness-gate.dmn`. The arc ends when the gates are green on #1896, the PR merges, and the steward runs `seed:ready --layer <name> --rehearse` before each seeding.

## State

| item | state |
|---|---|
| bean | `folio-assistant-hcpz` (epic `7x5n`), in-progress |
| PR | #1896, draft, branch `claude/seed-ready`; body holds the full survey and today's measurements |
| pushed | `078b7fa` script and criteria · `83aba38` tests · `b061195` BPMN gateway and skill text |
| local, uncommitted | DMN comment fix (`--layer` inside `<!-- -->`), `seed-ready.ts` added to `scripts/partition/instance-rules.ts`, and the regen / `render:bpmn` / `skill:register` outputs |
| script | `cat-harness/scripts/seed-ready.ts`; six criteria; `bun run seed:ready` |
| tests | `cat-harness/scripts/tests/seed-ready.test.ts`, 15 pass, using the real DMN |
| decision | `cat-harness/processes/kg/decisions/seed-readiness-gate.dmn` |
| process | `kg-separation.bpmn`: `GW_SeedReady`, `Task_Drain` (loops back to the gateway), `End_SeedUnknown`; the diagram is shifted +500 from x=3400 |
| skill | `kg-separation.md` §"Ready to seed? — asked at seed time, not at rehearsal" |

## Done, then next

Red on `b061195`, and fixed locally:
- **The XML-comment test.** It was a `--` inside the DMN header comment.
- **The partition's "nothing is unassigned" test.** `seed-ready.ts` is now classified as harness.
- **Stale generated files.** These were the glossary outputs, `kg-separation.svg`, the BPMN translation templates and the LSI page. The regen has run and now reports 92 current.

Next:
1. Finish `skill:register`, `render:bpmn:check` and `bun run gates`; they are running now.
2. Commit and push only when they are clean.
3. Run `gates --all` if there is disk to spare.
4. Once CI is green, mark the PR ready.

## Rulings and blockers

- **Owner, 2026-10-02: `heavy-mover` is a GitHub label.** The steward applied it to #1873, #1812, #1801, #1756 and #1735. With none open on the layer, the criterion passes; if the label cannot be read, the result is could-not-determine.
- **Owner, 2026-10-02: "Optional, run only on request with --rehearse."** Without it, the standalone criterion is could-not-determine, so `seed:ready` cannot answer `settled`. This is the constant `SETTLED_REQUIRES_REHEARSAL`.
- **Measured today:** both `cat-harness` and `cat-harness-tools` answer `not yet`.
  - Five heavy movers are open.
  - 29 open PRs touch cat-harness.
  - Sibling discovery misses 2 and 1 instances respectively. Separate work needs to make discovery work without the aggregate root.
- **Proxy:** `gh pr edit` fails because GraphQL is blocked. Use `gh api -X PATCH repos/litlfred/folio-assistant/pulls/1896`.
- **Disk:** check `df -h /` before heavy steps and stop under 3 GB. The rehearsal refuses below 3 GB on its own.


## Holder 2026-10-02 22:55Z
Driven by https://claude.ai/code/session_01SmeBn6QZsDFaNQ4GtuC2sd (Parcel B): main merged in, regenerated, gates. Re-measured the handover's '2 real test failures' first: both were already fixed in f388822; the full suite on that head had no failures of its own.
