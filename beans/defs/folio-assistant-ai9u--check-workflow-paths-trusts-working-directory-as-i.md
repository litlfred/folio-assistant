---
# folio-assistant-ai9u
title: check-workflow-paths trusts working-directory as input and never checks it exists — green over 8 dead ones
status: completed
type: bug
priority: high
created_at: 2026-09-22T08:29:05Z
updated_at: 2026-09-22T08:48:12Z
parent: folio-assistant-1xhc
---

_2026-09-22T08:35:00Z_ — Found while working `u9r9` on `claude/peaceful-heisenberg-dzgsf1`. `u9r9` is about two stale paths; **this is about the gate that should have caught them and reports clean.**

## The gate exists, and it is green over the whole defect

`cat-harness/scripts/check-workflow-paths.ts` — 701 lines, written for bean `52dz`, whose stated subject is *"every script path a workflow invokes must RESOLVE — from the directory the step actually runs in."* Its own header records two earlier blind spots it was extended to cover (`7iog`'s checkout `path:` prefixes, `a6kl`'s npm-script names). Run today:

    72 invocation(s): 55 resolve, 17 need a folio, 0 missing, 0 undetermined
    ✓ every workflow script path resolves, or is declared folio-only with a reason.

Meanwhile eight `working-directory` values across four workflows name directories that are absent or unusable (`u9r9`, and the sibling-session section in it).

## Two causes, and they compound

1. **`working-directory` is trusted INPUT, never a subject.** `invocationsFrom` reads it to compute the cwd a path resolves against (`stepCwd`, then `defaults.run`, then `cd` accumulation within the block). Nothing asks whether that directory is there. The precedence parse is careful and correct; it is answering a different question.
2. **A step with no script path is never examined.** Both TypeDoc steps run `npx typedoc`, so `invokedPath` declines the line — deliberately, per the module's own doc — and the step contributes zero invocations. A step can therefore be 100 % broken and invisible.

A step whose `working-directory` does not exist fails **every time, whatever it runs**. That is a stronger and cheaper-to-check property than any path resolution the module already does, and it is the one thing it does not check.

This is `1xhc` one level up from where `u9r9` was looking: **not a gate that does not fire, but a gate that fires, passes, and is blind to the case.** The `52dz` header already says the sharpest version of this — *"a path that does not resolve is not a type error, not a lint error, and not a test failure"* — and a cwd that does not exist is not even a path it looks at.

## The shape the fix has to take, and why a baseline is required

A naive criterion goes red immediately on six of the eight, and those six are **not defects**:

| workflow | value | what it is |
|---|---|---|
| `publish.yml`, `discoverability-docs.yml` | `folio-assistant` | **stale path** — the platform's own `schemas/` is at `cat-harness/schemas/` |
| `hecke-engine-wasm.yml` ×2 | `folio-assistant/computations` | `cat-harness/computations` exists but holds one `.json` and **zero `.py`** while the step runs Python |
| `snappea_wasm.yml` ×4 | `folio-assistant/snappea-wasm` | exists nowhere; folio content |

So it needs the `FOLIO_PATHS` treatment the module already has: an exemption table keyed on the value, each entry carrying a **reason**, and — the part that makes it honest — *every entry must match at least one occurrence or the run fails*, so an exemption for a step that no longer exists is caught rather than accumulating. That invariant is already written and tested in this module; the new criterion should reuse it rather than mint a second one.

Three states, not two, per this repo's standing rule: a `working-directory` under a checkout at another `ref:` (`pages` holds `gh-pages`) is **undetermined**, not a pass — exactly as the module already treats invocations under such a checkout.

## Done when

- [ ] Every `working-directory` (job `defaults.run`, step-level, and `cd` targets) is checked for existence against the tree the step actually sees
- [ ] A step with no invoked script path is still examined for its cwd
- [ ] Exemptions carry reasons and fail when they match nothing, reusing the `FOLIO_PATHS` invariant rather than a parallel one
- [ ] A checkout at a non-HEAD `ref:` yields `undetermined`, never a pass
- [ ] A test plants a workflow with a nonexistent `working-directory` and the check goes red — **mutation-tested**, since a reconciliation that holds by construction is the failure this repo has already paid for once (`t6s7`)

## Not in scope

Fixing `u9r9`'s two paths. That is a behaviour change to dormant steps and is the owner's call there, not a side effect of adding a gate here.


_2026-09-22T09:10:00Z_ — DONE on `claude/peaceful-heisenberg-dzgsf1`. The criterion is in, and **it isolates exactly the two paths `u9r9` names as real defects** out of 31 declarations, with no false positive to skim past.

    72 invocation(s): 55 resolve, 17 need a folio, 0 missing, 0 undetermined
    31 working-directory declaration(s): 4 resolve, 24 need a folio, 3 baselined,
                                          0 missing, 0 undetermined

That 24-vs-2 split is the sibling session's "six are a different case" finding, reached independently by a mechanism rather than by a reading — which is the only reason to build it rather than write it down.

## What it checks, and the one thing it deliberately does not

`working-directory` at all three levels (workflow `defaults.run`, job `defaults.run`, step). **Not `cd` targets**, and the reason is a real asymmetry rather than scope-trimming: GitHub evaluates `working-directory` **before** the script runs, so the directory must pre-exist, while a `cd` inside a `run:` block may target something that block just created — `publish.yml` does exactly that (`mkdir -p appendices/`). Folding them together would report a correct workflow as broken, which this module's own header calls worse than having no check: it teaches the reader to skim, and then the true positive goes by unread too.

## Two classifications that are NOT the ones the module already had

**A `gh-pages` checkout root RESOLVES here, where the same prefix is `Undetermined` for a script path.** Different questions: for a path it is *what is in that tree* (unknowable from HEAD); for a cwd it is only *does the directory exist when the step starts*, and `actions/checkout` creates it. Carrying the invocation rule across would have made `feature-staging.yml`'s `pages` a permanent unknown **nobody could ever retire** — the shape this module refuses everywhere else. A path *below* that root is still `Undetermined`.

**A workflow-level default is ONE finding, however many jobs inherit it.** Caught by the count disagreeing with a raw grep — 34 reported against 31 declared, because `snappea_wasm.yml` sets one value covering four jobs. My own doc comment already said not to do this while the code did it. Folded only when the verdict is IDENTICAL, because each job has its own checkout layout and the same value can resolve in one and not another; a second verdict is a second finding.

## The baseline is a ratchet, and it prints on green runs

`workdir-baseline.json`, three entries, each naming its bean and its reason — checked on load, so an entry with no reason throws rather than becoming permanent. It may only **shrink**: an entry matching nothing open fails the run, same direction as `FOLIO_PATHS` and `gates.ts`.

The held entries are printed **even when the run is green**. A baselined defect nobody is reminded of is one nobody retires, and this file exists to be emptied.

Distinct from `FOLIO_WORKDIRS`, and the split is the point: that table says *absent here on purpose, always will be* (24 declarations); the baseline says *somebody still owes an answer* (3). Collapsing them would turn two open defects into accepted architecture.

## Mutation-tested, because `t6s7`

19 new tests (53 in the file). The Done-when asked for a red case; a red case that holds by construction is `t6s7` exactly, so I mutated the implementation three ways and confirmed the suite catches each:

| mutation | result |
|---|---|
| `classifyWorkDir` always returns `Resolves` | **10 fail** |
| workflow-level dedup removed | **1 fail** |
| `gh-pages` root back to `Undetermined` | **1 fail** |

Restored: 53 pass, 0 fail.

## A gate caught me inside the gate

`check:declared-paths` went `0 → 2` on this file: I had composed `join(root, "cat-harness", "scripts", ...)`, a second place that knows where this script lives. `check-lockfile-pinning.ts` reaches its own baseline with `import.meta.dir` and that is the answer. The four `FOLIO_WORKDIRS` match values then needed `declared-path-literal:` markers with reasons — they are values matched against **workflow text**, not paths this repo reads, which is what that marker is for.

Worth recording plainly: **this repo's path discipline caught a path-discipline defect in the check being written to enforce path discipline**, before it left the working tree. That is the gate working, not an obstacle.

## Summary of Changes

- `check-workflow-paths.ts`: `WorkDir`, `FOLIO_WORKDIRS`, `workDirsFrom`, `classifyWorkDir`, `allWorkDirs`, `workDirBaseline`, `workDirKey`; `main()` reports and gates on both criteria
- `workdir-baseline.json`: 3 held entries, reasons required
- `tests/check-workflow-paths.test.ts`: +19 tests, mutation-verified

## Not done

`u9r9`'s two paths are **not** fixed. Correcting them makes dormant steps live, which is the owner's call there — `u9r9` says so and this bean said so at the outset. The baseline is what lets the gate ship green without pretending they are fine.
