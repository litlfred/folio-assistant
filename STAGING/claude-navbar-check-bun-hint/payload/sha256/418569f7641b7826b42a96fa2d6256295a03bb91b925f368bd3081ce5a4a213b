---
# folio-assistant-gz47
title: 'Audit every declared subgraph for literal paths in tests and consumers: check:declared-paths sees only cat-harness''s own declarations and code'
status: completed
type: task
priority: normal
created_at: 2026-10-03T08:51:59Z
updated_at: 2026-10-04T13:34:36Z
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
- [x] measured: for every declared directory in every instance (not only cat-harness's), the literal-path references to it in every instance's code and tests, split into fixture / test-vector / layout assertion / real corpus reference (the four populations the gate's header already names)
- [x] the gate widened to the checkout (every instance's declarations, every instance's source trees), with a ratchet baseline for what exists, so no new literal can land
- [x] the existing-file exemption revisited against the content-source ruling: a file under a subgraph whose source could move is not stable just because it exists today
- [x] real corpus references fixed the way #1948 fixed fsh-guts (through the declaration's resolver), in batches, each with a mutation check
- [x] the skill that governs the gate updated (the gate's header names the rule; find its skill with skill_list)

Related: 9c7h (the trigger), the 2026-10-03 content-source ruling (subgraph source = directory | branch | graph-db), ho66 (standalone rehearsal: many of its 469 failures are the same "assumes this repository's layout" shape).

## Status 2026-10-03 (Parcel B session)
- **measured**: five batches (fsh-guts, todos, beans, uploads, docs), recorded in the notes under `beans/notes/folio-assistant-gz47--*`.
- **gate widened**: `check:foreign-paths` (#2017, merged) scans every instance's non-test source for literals into ANOTHER instance's declared directories, with a one-way ratchet. On main after #2003 the baseline is **empty**: 0 counted, 19 marked with reasons. The last site, the convention fallback in `beans-prime.ts`, is marked in this PR.
- **real references fixed**: #2003 (merged), batches 1–4, each falsified by simulating the move.
- **skill**: `kg-core/directory-conventions.md` §"A consumer never spells a declared directory's path".
- **still open**: the existing-file exemption in `check:declared-paths`, revisited against the content-source ruling. A file under a subgraph whose source could move is not stable just because it exists today. That is a policy call on the older gate, left for whoever owns it.


## Owner ruling 2026-10-04 — the existing-file exemption

Asked with four options (one-way baseline / fix every site now / exempt for good / decide later); the owner chose **1, a one-way baseline**.

## Summary of Changes

- `check:declared-paths` no longer accepts a literal just because the file it names exists today. The witnesses recorded on 2026-10-04 (148) are the baseline; a NEW literal naming an existing file fails the gate (`newWitnesses`), and `--update` refuses to add one, so the list only shrinks. Four had landed unnoticed since the list was first written, and are recorded in this baseline.
- Falsified: a planted `"schemas/merge-queue.ts"` literal made the gate exit 1, failed `declared-paths.test.ts`, and `--update` refused it (exit 1, baseline still 148); removed, the gate passed again.
- Skill: `kg-core/directory-conventions.md` §"A consumer never spells a declared directory's path" states the rule.
- Earlier batches: the gate widening is `check:foreign-paths` (#2017), and real references were fixed in #2003.
