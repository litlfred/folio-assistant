---
# folio-assistant-vo9d
title: 'ORPHANED MECHANISM: translation-roundtrip and check-l1-complete have entry points and no callers, while the BPMN asserts the step runs'
status: todo
type: task
priority: high
created_at: 2026-09-20T11:31:09Z
updated_at: 2026-09-20T11:32:04Z
parent: folio-assistant-d308
---

Found 2026-09-20 while measuring `pha7`, whose corrected form asked which of its
24 files the five existing translation Tool nodes actually reach. **Two of
twenty-four.** Two others are reached by nothing at all.

## The finding

| file | entry point | callers |
|---|---|---|
| `content/pipeline/translation-roundtrip.ts` | `import.meta.main` | **none** |
| `scripts/check-l1-complete.ts` | `import.meta.main` | **none** |

For `translation-roundtrip`, "none" was checked four ways:

- no Tool node — the five nodes' `inProcess` all point at
  `src/tools/translation.ts`, which imports only `pot-extract` and `po-inject`
- no `package.json` script
- no GitHub workflow
- **no importer** — `grep "from.*translation-roundtrip"` across the corpus returns
  nothing

Its only two mentions anywhere are a `@see` comment in `schemas/translation.ts`
and a `console.log` in `scripts/translation/simulate-translation.ts` printing
*"then translation-roundtrip.ts with a pair of agents"*.

`check-l1-complete.ts` is the same shape: its sole occurrence outside itself is a
string literal in `repo-partition.ts`'s classification table.

## Why this is a distinct defect and not just dead code

**`Task_RoundTripQA` is a live `serviceTask` on the critical path** of
`skills/workflows/translation-workflow.bpmn`:

```
Task_PoInject → Task_RoundTripQA → Gateway_Drift
```

So three surfaces agree that a step happens which nothing invokes: the diagram
draws it, `translation-manager` is covered by five Tools, and the program exists.
`ingest-l1-completeness-gate · Task_RoundTrip` is the same for `check-l1-complete`.

**This inverts `covered-is-not-reachable`'s third case.** That case is a mechanism
with no entry point (`checkFolioProfile`, bean `0bzg`). This is a mechanism WITH
an entry point and no callers. Both are invisible to `tools:coverage`, and this one
is the harder to notice, because everything a reader checks — the skill, the
diagram, the file — is present.

## Related, and neither covers this

- **`ktt2`** (open, blocked by `68dt`) designs the back-translation capability. It
  is about whether the check is right, not about whether anything runs it.
- **`dw7v`** (completed) removed the simulated round-trip numbers after *"remove
  fake data"*: `simulate-translation.ts` held a hand-written map of 6
  back-translations against 36 msgids, so the 21 "failures" measured absence
  rather than drift.

**A hypothesis, flagged as one rather than asserted:** `dw7v` may be when this path
lost its last caller — removing the simulation removed the only thing that
exercised it. Not verified; it needs the commit history read, and that is a
different piece of work from this measurement.

## Options, with what each costs

1. **An npm script for a person.** Cheapest and honest about what it is: the check
   back-translates **with a pair of agents**, so it cannot run unattended, and a
   script names it without pretending otherwise. Cost: still nothing in CI, so the
   gap persists — it is only now nameable.
2. **A step an agent performs inside the workflow.** Matches reality best — the
   diagram already draws it as a `serviceTask`, and an agent in the translation
   lane is exactly who has the two translation agents. Cost: it fires only while
   somebody is working, which is the objection recorded against option 2 of
   `what-kick-off-means-for-a-ci-watcher`.
3. **A `qa-sweep` axis.** Gets a committed per-block verdict and the
   "never checked" / "checked and clean" distinction. Cost: `qa-sweep` runs
   unattended, and this check cannot, so the axis would have to report
   could-not-determine whenever no agents are available — which is correct but
   makes most runs report nothing.

**Recommendation: option 2.** The diagram already asserts an agent performs this
step, so wiring it there makes the existing assertion true rather than adding a
new claim. Option 1 leaves CI exactly as blind as it is now; option 3 promises
unattended checking that this particular check cannot deliver.

**Deliberately not chosen here.** Wiring a `serviceTask` to a mechanism changes
what the workflow engine will hand an agent, and `ktt2` is still open on whether
the check itself is designed right — committing a caller before that is settled
would bind the process to a check that may change shape.

## Also worth deciding

`check-l1-complete.ts` is smaller and probably just wants an npm script beside
`check:corpus-gate`, but it is a folio-tree check, so it would sit in
`SCRIPT_EXEMPTIONS` as `no-folio` and never run here. Same question as `0bzg`
option 1.

## If nothing is decided

Status quo: both programs stay in the tree, unreachable, while the diagram and
the skill coverage both read as though the step happens. Nothing regresses — the
gap is simply now written down instead of inferable only by grepping for callers.

## Done when

- [ ] one of the three chosen for `translation-roundtrip`, by a person
- [ ] `check-l1-complete` either gains a caller or is recorded as deliberately manual
- [ ] `covered-is-not-reachable` gains this as the INVERSE of its third case —
      entry point present, callers absent
- [ ] the `dw7v` hypothesis either confirmed from history or struck
