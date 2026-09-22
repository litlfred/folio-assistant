---
# folio-assistant-ai9u
title: check-workflow-paths trusts working-directory as input and never checks it exists — green over 8 dead ones
status: in-progress
type: bug
priority: high
created_at: 2026-09-22T08:29:05Z
updated_at: 2026-09-22T08:29:29Z
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
