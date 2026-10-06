---
# folio-assistant-ejye
title: 'Placement PR0: mechanisms only — checkout aggregates, roles/actors/capabilities extended by id, group sub-subgraphs for every kind'
status: completed
type: task
priority: normal
created_at: 2026-10-01T00:03:29Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-9umr
blocked_by:
    - folio-assistant-hx65
---

PR0 of the approved placement proposal (owner rulings 2026-09-30, bean 9umr's eight groups). Mechanisms only, NO content moved: (0a) the checkout root instance needs every staged instance and declares the 7 checkout-level state graphs; corpus-wide tools resolve over the checkout overlay; cat-harness's scope:repository mirrors removed; a check refuses a new mirror. (0b) a higher instance extends a harness role (skills), actor (roles, capabilities) or the capability registry by id from its own scenarios/, the way a voice points at the role it addresses. (0c) group (sub-subgraph) declarations from within for processes, schemas, library, uml, tests; the concern-group code list; nested member resolution. Owner ruling 6: tools may describe their own specific subprocesses.

## Done when

- [x] Falsifier 1: corpus-wide knownSkills / workflowFiles / role skills unchanged  — pinned test passes on main 2026-10-06
- [x] Falsifier 2: cat-harness resolved alone sees nothing above it  — pinned test passes on main 2026-10-06
- [x] Each mechanism has a test; skill:register, regen, gates green  — green on #2317 head 39e0c3e (whole gate set), 2026-10-06

## 2026-10-01 — built on branch pr0-mechanisms (local, not pushed)

- 0a: root instance needs all 16 staged instances and declares beans, todos, memory, interaction, issue-marks, fsh-guts, root-docs; 19 mirrors removed from cat-harness.json; sci declares skills/data/ from within; checkoutDirectories / corpusDirectoriesForGraph / CorpusScope; check:instance-graph refuses unstaged instances and repository-scoped mirrors.
- 0b: schemas/scenario-overlay.ts — role extensions (skills), actor extends (roles, capabilities), capability extends (requires); redeclaring a lower id refused.
- 0c: concernGroups + declarationFile on processes/schemas/library/uml/code; code-lists/concern-group.json; scripts/concern-groups.ts; nested member resolution; check:concern-groups (CI).
- Ruling 6: ToolDefinition.subprocesses, checked by check:tools.
- Falsifier 1: corpus knownSkills (289), workflowFiles (81), every role's skills identical. Falsifier 2: pinned as a test. Falsifier 3 (cross-instance sidecar relocation into the OWNER's tree): not supported — relocation lands in the auditor's _external/ tree; PR1 decides.
- Gates: same 11 failing as origin/main in the same environment; nothing new.


## 2026-10-01 — separation arc (7x5n)
Merged (#1758 / #1760). Remaining boxes need green gates ON MAIN, which is red at cdb0a018, so this waits on S0 (hx65) and closes in S1 (a4of).

## 2026-10-01 — regression found and restored (session session_01CVVoavPoCHMLA7AASxG8cH, PR #1769)
0a was merged in 9962556c and then undone on main by merge resolutions (aab80f35, 16c02d33), along with 15 reader files reverting to cmsl step 2's parallel version. #1769 restores both. CI never showed it: Repository gates stops at its first red step, so check:instance-graph (which refuses the state) was skipped.

## 2026-10-06 — falsifiers re-run on main (claude/sep-bookkeeping-s1-s3, 7x5n S1)

Both falsifiers are now pinned as tests in `cat-harness-tools/scripts/tests/placement-pr0-mechanisms.test.ts`, and both pass on main at 24b221415:
- "falsifier 1: the corpus-wide answer still holds every dependent's skills and diagrams"
- "the platform resolved ALONE sees nothing above it (cmsl falsifier: a split checkout sees less)"

`bun test` on that file plus `test/placement-pr1-content-up.test.ts`: 33 pass, 0 fail. `check:instance-graph` and `check:concern-groups` exit 0. The third box (each mechanism has a test, plus skill:register, regen and gates green) is judged by `bun run gates` on the bookkeeping branch.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n S1, a4of). Each box was re-derived on main, not taken from the 2026-10-01 note:
- **Falsifiers 1 and 2:** pinned tests in `cat-harness-tools/scripts/tests/placement-pr0-mechanisms.test.ts` pass on main at 24b221415 (33 pass, 0 fail, with `test/placement-pr1-content-up.test.ts`).
- **Box 3:** every mechanism has a test in that file: 0a checkout aggregates, 0b role/actor/capability extension, 0c concern groups, and ruling 6 Tool subprocesses. `check:instance-graph` and `check:concern-groups` exit 0. The **whole CI gate set is green** on PR #2317 head `39e0c3e`, which is main at `d7ba198` plus bean edits: all four bun test shards, every "Repository gates (hard)" job, the Skill-registration chain (`skill:register`), lint and types, end-to-end, and merge-guard (evaluate).

The 2026-10-01 regression (0a undone by merge resolutions) was restored by #1769, and `check:instance-graph`, which refuses that state, is green on main.
