---
# folio-assistant-95s1
title: 'IMPORT CYCLE: EXTENDED_AUTOMATED_CHECKERS is reachable in its temporal dead zone, and discovery only survives it'
status: completed
type: task
priority: normal
created_at: 2026-09-21T11:14:16Z
updated_at: 2026-09-21T15:40:00Z
parent: folio-assistant-vke6
---

Found while excising `harness.json` (bean 6n23, PR #695), and NOT fixed there.

`qa-checker-discovery.findChecker` enumerated a module namespace with
`Object.values`. That throws outright — `Object.keys` too — when any export is
a `const` still in its temporal dead zone, which happens when the module is
part of an import cycle and is read while mid-evaluation. Measured 2026-09-21:
`qa-checkers-extended.ts`'s `EXTENDED_AUTOMATED_CHECKERS`, reached through such
a cycle, took down an entire `qa-sweep` that had nothing to do with it.

## It predates the branch that found it

Checked rather than assumed: the failing test still failed with 6n23's
`profile-check` change reverted. What 6n23 changed is that the one-file model
REACHES it — a corrupt config is now a corrupt declaration, so the sweep takes
a path it did not take before.

## What was done, and what deliberately was not

`findChecker` now skips a binding it cannot read, and says in place that the
cycle is not fixed. That is the right call for a discovery routine — a value
that cannot be read is not a dispatch table, and the alternative is one cycle
anywhere costing every criterion its checker. But it is a GUARD, not a repair:
the cycle is still there and will surface somewhere else.

## THERE IS NO CYCLE. This bean's own diagnosis was wrong.

Measured 2026-09-21, before changing anything: the TypeScript import graph
under `cat-harness/` has **950 modules and exactly two strongly-connected
components** — `schemas/constraints.ts` ⇄ `schemas/types.ts`, and
`content/pipeline/_folio-chapter-profiles.qou.ts` ⇄
`content/pipeline/qa-checkers-q-usage.ts`. **Neither contains
`qa-checkers-extended.ts`**, and nothing reaches back into it.

`qa-checkers-extended.ts` does import `qa-checkers-q-usage.ts`, so it touches
the second component — but touching a cycle is not being in one, and the
binding that went into its dead zone is its OWN.

## What actually happened — a module-scope side effect that threw

`qa-checkers-extended.ts` opens with, at line 49:

    const REPO_ROOT = findContentRepoRoot();

That resolved through a declaration which would not parse, so `folioDir` threw
and **evaluation aborted at line 49**. `EXTENDED_AUTOMATED_CHECKERS` is
declared at line 3235, so it was never bound — and a later `await import()`
handed back the half-built namespace instead of re-throwing. Enumerating it
then raised *"Cannot access 'EXTENDED_AUTOMATED_CHECKERS' before
initialization"*, **naming a symptom three thousand lines from the cause.**

Confirmed in both directions rather than argued: reverting PR #695's
`repo-root.ts` fix brings the error straight back, and restoring it makes the
reproducer pass **with the guard removed entirely**.

So the throw source is already gone. The shape is not: a dozen pipeline modules
do filesystem work at module scope (`const REPO_ROOT = findContentRepoRoot()`
appears in 12 files), and any of them can fail the same way.

## The guard was masking, which is what this bean actually fixes

Re-examined per the third box, and it was **not** still guarding something
real in the form it had. `moduleValues` returned an empty list on failure, so
`discoverFor` went on to report:

    exports neither a dispatch-table entry "<id>" nor check<Id>()

A **determined and false** statement about a module nobody could read — the
third-state rule broken by the guard written to uphold it, in the same PR.

`readModule` now returns `undefined` for a namespace that cannot be enumerated
at all, and `discoverFor` reports *"module did not finish evaluating — its
exports were never bound"*, pointing at the module's own top level. A single
unreadable binding beside good ones stays narrow: it skips that one export
rather than condemning the module, or one bad export would hide every checker
next to it. The named-export fallback got the same guard — it read a binding
directly and threw.

## Done when

- [x] The cycle is identified — **there is none**, and the measurement that
      says so is above. The real mechanism is a module-scope side effect.
- [x] It is broken, or declared acceptable with the reason — not applicable:
      the throw source was already fixed in #695. The remaining exposure (12
      modules doing filesystem work at import time) is recorded here rather
      than swept, because changing it is a repo-wide pattern change and
      nothing is currently failing on it.
- [x] The guard in `findChecker` is re-examined — it was masking, and now
      reports the failure under its own name. Four tests pin the distinction,
      and the regression was planted to confirm they fail on the old
      behaviour rather than passing vacuously.

## Follow-up worth its own bean, not taken here

**Filesystem work at module scope.** `const REPO_ROOT = findContentRepoRoot()`
in 12 pipeline modules means importing any of them can throw, and a module
that throws while evaluating produces exactly the confusing symptom above. A
lazy accessor would remove the class. Not done here because it is a pattern
change across a dozen files with no current failure driving it, and this bean
is about the reporting defect.

---

## A second session worked this independently — what it adds, and one correction

Session `017MEZnJxx7WeekiNCabx4hx` reached the same conclusion from the other
end, unaware of PR #707 until merging main. Recorded here rather than dropped,
because the two measurements disagree on a number and the disagreement is
instructive.

### The two cycle counts are both right, over different graphs

| | graph | result |
|---|---|---|
| PR #707 | every import edge, `import type` included | **2** strongly-connected components |
| this session | RUNTIME edges only — type-only specifiers and type-only clauses erased | **0** cycles, over 1108 resolved edges |

Neither needs retracting, and checking which is which took one look at the two
components #707 names:

- `schemas/constraints.ts` → `schemas/types.ts` is `import type { Block }`.
- `_folio-chapter-profiles.qou.ts` → `qa-checkers-q-usage.ts` is
  `import type { QRegime }`.

Both are **erased at runtime**, so each pair is one-directional once the types
are gone. The type-level cycles are real and TypeScript resolves them; the
runtime module graph has none. Same conclusion about
`qa-checkers-extended.ts` from both, by different routes.

### A defect in the runtime measurement, found by comparing

The zero was very nearly a vacuous one. The second session's resolver treats a
specifier with an unknown extension as already-resolved, so
`import … from "./_folio-chapter-profiles.qou"` never tried
`_folio-chapter-profiles.qou.ts` and the edge was **dropped** — then dismissed
in the drop audit as "a `.qou` data path", which it is not: it is a module, and
that is the very edge #707's second component runs through. The conclusion
survives only because the reverse edge is type-only. **Had it been a value
import, a real cycle would have been reported as zero** — the exact failure the
drop audit exists to catch, passed over by a wrong guess about one entry in it.

### What this session adds — the failure is cached

`readModule` makes a half-built namespace a third state instead of a false
"exports neither". Orthogonal to it, `loadCheckerModule` stops discovery
reaching that namespace at all: **a second dynamic import of a module whose
evaluation threw does not throw again** — it resolves with the half-built
namespace. Eight lines, Bun 1.3.11, no cycle:

```ts
// boom.ts:  export const BEFORE = 1; const _ = explode(); export const AFTER = {};
await import("./boom.ts");             // REJECTS: "top-level failure"
const mod = await import("./boom.ts"); // RESOLVES
Object.keys(mod);                      // THROWS: Cannot access 'AFTER' before initialization
```

The single-import case rejects correctly, which is why one import proves
nothing — and is why this was missed until the fixture imported twice.

Caching the failure keeps the **cause**. Without it the first criterion reports
`cold-chain-guidance.config.json is not valid JSON` and every sibling criterion
sharing that file reports "module did not finish evaluating" — the symptom
`readModule` rightly declines to guess past. One broken checker module is one
finding, stated once, in the words of the thing that actually failed.

Pinned by `checker-module-load-failure.test.ts` against a fixture that throws,
with two fixture files rather than one: a module registry is keyed by path, so
once any test in the process has imported the broken fixture twice, every later
`import()` of it resolves with the stale namespace and a cache test sharing it
would be testing the registry instead.
