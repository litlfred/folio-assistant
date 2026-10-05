---
# folio-assistant-0uu2
title: 'DECLARATION GAP: every top-level directory is a declared subgraph — the split, and the headline count was wrong three ways'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-23T22:58:39Z
updated_at: 2026-09-24T06:22:01Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: 'bootstrap/ should be its own subgraph.... in fact QA: in harness `<stub>/*.*` should be a subgraph.' The FIRST half only — which top-level directories are undeclared, and what each should become. The reference-direction half is a sibling session's.

Deliverable is a SPLIT (declare / fold / remove / already-declared / not-mine), not a sweep. Implement only what the owner picks.


## Progress, 2026-09-24 — issue #1223, PR #1224

MEASURED (re-derived on 7c4c7fd23, `instanceRootsIn`, never a path literal):
17 instances, 80 top-level directories, 62 declared, 18 not. Only **12 hold a
file no declared directory covers**; 6 are pass-through containers whose every
file is covered by a declared child. `cat-harness/content` is 718 of the 744
uncovered files and is `ylj7`'s. **The remaining gap is 11 directories, 26
files** — not the 19 / 1,731 first reported.

### Three first-pass measurements were wrong, and all three failed identically

1. Eight root-level directories declared by cat-harness with `scope:
   "repository"` read as undeclared — which also makes the self-declaration
   question moot, because the parent already lists them.
2. `cat-harness/latex/` and `computations/` reported as referenced by nothing.
   They are named by four workflows, a skill and `wall-violations-sweep.ts` —
   **by paths that do not resolve**. `v8gh` and `dh4f` over one pair of files.
3. The blueprint reported as 33/128 live Lean refs. Real figure **111/128**;
   the search used the fully-qualified `QOU.Boson`, which Lean source never
   contains because it writes `namespace QOU` then the bare name.

Each asked about the string a path or name is written **AS** rather than the
string a consumer **WRITES**. That is the finding under the finding.

### Owner decisions taken and executed

- Verify against litlfred/qou, then remove → `computations/` and `latex/`
  **removed** (qou holds both; and this repo's preamble was the SUPERSEDED one,
  still defining 16 typo macros qou deleted 2026-08-22 saying "do not restore").
- blueprint → qou, home_page → drop → `home_page/` **removed**;
  `blueprint/` **held** pending litlfred/qou#7453 (issue litlfred/qou#7452).

## Done when

[x] the gap is measured over the framing a consumer actually uses
[x] the split is written down: declare / fold / remove / already-declared / not-mine
[x] the QOU residue is resolved or has an owner decision recorded
[ ] blueprint/ removed here once litlfred/qou#7453 merges
[ ] the 4 declare + 1 fold picked and implemented
[ ] cat-harness/viewer/ decided
[ ] the pass-through <instance>/skills/ parents: model question answered
