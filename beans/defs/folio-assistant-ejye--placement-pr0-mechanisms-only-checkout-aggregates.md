---
# folio-assistant-ejye
title: 'Placement PR0: mechanisms only — checkout aggregates, roles/actors/capabilities extended by id, group sub-subgraphs for every kind'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T00:03:29Z
updated_at: 2026-10-01T08:15:15Z
parent: folio-assistant-9umr
blocked_by:
    - folio-assistant-hx65
---

PR0 of the approved placement proposal (owner rulings 2026-09-30, bean 9umr's eight groups). Mechanisms only, NO content moved: (0a) the checkout root instance needs every staged instance and declares the 7 checkout-level state graphs; corpus-wide tools resolve over the checkout overlay; cat-harness's scope:repository mirrors removed; a check refuses a new mirror. (0b) a higher instance extends a harness role (skills), actor (roles, capabilities) or the capability registry by id from its own scenarios/, the way a voice points at the role it addresses. (0c) group (sub-subgraph) declarations from within for processes, schemas, library, uml, tests; the concern-group code list; nested member resolution. Owner ruling 6: tools may describe their own specific subprocesses.

## Done when

- [ ] Falsifier 1: corpus-wide knownSkills / workflowFiles / role skills unchanged
- [ ] Falsifier 2: cat-harness resolved alone sees nothing above it
- [ ] Each mechanism has a test; skill:register, regen, gates green

## 2026-10-01 — built on branch pr0-mechanisms (local, not pushed)

- 0a: root instance needs all 16 staged instances and declares beans, todos, memory, interaction, issue-marks, fsh-guts, root-docs; 19 mirrors removed from cat-harness.json; sci declares skills/data/ from within; checkoutDirectories / corpusDirectoriesForGraph / CorpusScope; check:instance-graph refuses unstaged instances and repository-scoped mirrors.
- 0b: schemas/scenario-overlay.ts — role extensions (skills), actor extends (roles, capabilities), capability extends (requires); redeclaring a lower id refused.
- 0c: concernGroups + declarationFile on processes/schemas/library/uml/code; code-lists/concern-group.json; scripts/concern-groups.ts; nested member resolution; check:concern-groups (CI).
- Ruling 6: ToolDefinition.subprocesses, checked by check:tools.
- Falsifier 1: corpus knownSkills (289), workflowFiles (81), every role's skills identical. Falsifier 2: pinned as a test. Falsifier 3 (cross-instance sidecar relocation into the OWNER's tree): not supported — relocation lands in the auditor's _external/ tree; PR1 decides.
- Gates: same 11 failing as origin/main in the same environment; nothing new.


## 2026-10-01 — separation arc (7x5n)
Merged (#1758 / #1760). Remaining boxes need green gates ON MAIN, which is red at cdb0a018, so this waits on S0 (hx65) and closes in S1 (a4of).
