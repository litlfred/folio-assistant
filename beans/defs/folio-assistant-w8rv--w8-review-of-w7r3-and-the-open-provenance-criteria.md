---
# folio-assistant-w8rv
$schema: bean/1.0.0
title: 'W8 review of the w7r3 round, then the open provenance criteria (page fragments, dependency closure, terminology)'
status: in-progress
type: task
priority: high
created_at: 2026-10-24T00:30:00Z
updated_at: 2026-10-24T08:40:00Z
parent: folio-assistant-a9tx
---

What a9tx still needs, now that its four connected-agent runs (qzex, fpmn, wv7r, w7r3) are
done. The cloud thread "Publisher AST" holds it.

## 1. W8: diff the w7r3 incremental AST against the full build

Results: `ast-results/2026-10-23-w7r3` @ `539c086`. W7 converged in 1 round for both
probes. Run `ig-ast.ts diff` for each probe, W7 against W8, and run the
`ig-ast-delta-review.bpmn` review. Then tick W7 and W8 in a9tx, or say what fails.

## 2. The open criteria in a9tx

- page-fragment provenance: which source produced which output fragment;
- the resolved dependency closure, with pinned versions;
- terminology expansion provenance: which server, and which version.

These are W3 (criteria 4 and 5) and W4 (criterion 3, the only step that needs the core
fork). Each needs a scope and the owner's go-ahead before any build.

## Done when
- [x] W8 diff and review recorded in a9tx, and W7/W8 ticked or reasons given (reasons given: two causes, fixed; round 4 is `w7r4`)
- [ ] W3 scoped and put to the owner
- [ ] W4 scoped and put to the owner

## Log
- 2026-10-24 00:30Z: claimed by the "Publisher AST" thread. Opened at the CI speed thread's request, because a9tx had no open child and that turned `check:bean-rollup` red.
- 2026-10-24 01:00Z: W8 review of w7r3 done (see a9tx). Fork `72b2ba9` and `3896c6c` fix both causes. Round 4 is bean `w7r4`. W7/W8 stay unticked until w7r4 diffs clean.
- 2026-10-24 07:45Z: W8 review of w7r4 done (see a9tx). Content and edges match; narrative link fix in `6abb8a5`. Round 5 is bean `w7r5`.
- 2026-10-24 08:40Z: w7r5 crashed in `checkDependencies` (context refuses to list ValueSets). Fixed in `cf45726` and `8c2d917`. Round 6 is bean `w7r6`.
