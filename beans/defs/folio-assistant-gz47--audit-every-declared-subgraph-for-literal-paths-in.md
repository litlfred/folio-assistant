---
# folio-assistant-gz47
title: 'Audit every declared subgraph for literal paths in tests and consumers: check:declared-paths sees only cat-harness''s own declarations and code'
status: todo
type: task
created_at: 2026-10-03T08:51:59Z
updated_at: 2026-10-03T08:51:59Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-03: "audit other declared sub-graphs. may have same issue with tests or other consumers". The trigger was fsh-guts (9c7h): five tests and one writer named `fsh-guts/` by path, and #1945 and #1948 moved them onto the declaration (`fshGutsDirectory`). The owner's 2026-10-03 content-source ruling makes the class general: ANY declared subgraph's source may move (directory → branch → graph-db, overridable per instance), so a literal path to one breaks or goes vacuous on the move.

## Why the existing gate did not catch fsh-guts (measured on main, 2026-10-03)
`check:declared-paths` (cat-harness/scripts/check-declared-paths.ts) is the right mechanism. It scans tests, and it catches `join(root, "processes")`. Its SCOPE is too narrow, though:
1. `root` is `cat-harness/`, and the declarations it checks against are cat-harness's OWN (`resolveDirectories([{ root, own: true }])`). Directories declared by any OTHER instance are invisible to it. That covers the root instance's `fsh-guts`, `beans`, `todos`, `memory`, `issue-marks`, `interaction` and `health`, and who-iris's, fhir-harness's, folio-assistant-core's and the smart-* directories.
2. It scans only cat-harness's own `SOURCE_DIRS`. Code in other instances is never read; `folio-assistant-core/scripts/sample-import-run.ts`, the hard-coded fsh-guts writer fixed in #1945, is an example.
3. A literal that names an EXISTING FILE is allowed, on the assumption that a declared directory stays where it is. Under the content-source ruling that assumption no longer holds.
Every baseline key is cat-harness-relative (`scripts/…`, `schemas/…`), which is consistent with (1) and (2).

## Done when
- [ ] measured: for every declared directory in every instance (not only cat-harness's), the literal-path references to it in every instance's code and tests, split into fixture / test-vector / layout assertion / real corpus reference (the four populations the gate's header already names)
- [ ] the gate widened to the checkout (every instance's declarations, every instance's source trees), with a ratchet baseline for what exists, so no new literal can land
- [ ] the existing-file exemption revisited against the content-source ruling: a file under a subgraph whose source could move is not stable just because it exists today
- [ ] real corpus references fixed the way #1948 fixed fsh-guts (through the declaration's resolver), in batches, each with a mutation check
- [ ] the skill that governs the gate updated (the gate's header names the rule; find its skill with skill_list)

Related: 9c7h (the trigger), the 2026-10-03 content-source ruling (subgraph source = directory | branch | graph-db), ho66 (standalone rehearsal: many of its 469 failures are the same "assumes this repository's layout" shape).
