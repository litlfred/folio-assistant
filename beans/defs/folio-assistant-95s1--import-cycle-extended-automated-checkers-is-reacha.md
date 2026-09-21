---
# folio-assistant-95s1
title: 'IMPORT CYCLE: EXTENDED_AUTOMATED_CHECKERS is reachable in its temporal dead zone, and discovery only survives it'
status: completed
type: task
created_at: 2026-09-21T11:14:16Z
updated_at: 2026-09-21T13:20:00Z
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

(Original "Done when" removed — it is restated and answered at the end, and two
copies of the acceptance criteria are two places for them to disagree.)

---

## Resolved 2026-09-21 — **there is no import cycle**, and never was

The title of this bean is wrong, and so were the commit message that opened it
(`fd57e83c`) and the comment it left in `findChecker`. Recorded here rather
than quietly corrected, because a comment asserting a *measured* cause that
does not exist sends the next agent hunting something that is not there — it
sent this one.

### What was measured

| question | method | answer |
|---|---|---|
| is there a runtime import cycle today? | static detector over every `.ts` in the repo, runtime edges only (`import … from`, `export … from`, side-effect `import "x"`, dynamic `import("./lit")`); type-only specifiers and type-only clauses erased | **no** — 0 cycles over 1108 resolved edges |
| …were 1108 edges all of them? | audited the drop: an edge whose target is not a scanned file is an edge **not looked at** | 5 dropped, each explained — a `.qou` data path, a template-literal specifier, and three from `fsh-guts/scripts/generate-docs.ts`, deliberately retired (bean `3w0i`) |
| was there one at `fd57e83c`, where the crash was seen? | same detector against a worktree at that commit | **no** — 0 |
| was the detector capable of finding one? | falsified both ways: planted `a↔b` value cycles, `export…from` cycles and side-effect cycles are all caught; type-only cycles correctly ignored | yes |
| is `qa-checkers-extended` in a cycle with `qa-sweep`? | shortest-path search in both directions, dynamic imports included | **no path either way** |

### What actually happened

Reproduced at `fd57e83c^` and instrumented, in the one test that fails there —
`profile-scoping.test.ts` › *"a folio whose config cannot be read keeps its
coverage"*, which spawns `qa-sweep` as a subprocess over a folio with an
unparseable config:

```
[imp] START    voice-title-scholarly   .../qa-checkers-extended.ts
[eval] extended START n=1
[eval] before findContentRepoRoot
[imp] REJECTED voice-title-scholarly   ... is not valid JSON: JSON Parse error
[imp] START    proof-no-bare-sorries   .../qa-checkers-extended.ts
[imp] RESOLVED proof-no-bare-sorries   .../qa-checkers-extended.ts
[probe] Object.keys THREW ... Cannot access 'EXTENDED_AUTOMATED_CHECKERS' before initialization
```

1. `qa-checkers-extended.ts` aborts at its **top-level** `findContentRepoRoot()`
   (line 49) — thousands of lines above where `EXTENDED_AUTOMATED_CHECKERS` is
   declared (3235). The first `import()` **rejects**, and discovery reports it
   honestly.
2. Discovery did not remember the failure, and several criteria share that
   file, so the next criterion imported the same path again.
3. **The second import RESOLVES** — Bun serves the namespace of the
   half-evaluated module instead of re-raising the stored evaluation error. The
   module body is *not* re-run (`n=1` never becomes `n=2`).
4. `Object.keys` over that namespace throws for every binding below the abort.

Minimal reproduction, no cycle anywhere, Bun 1.3.11 — and the single import
case behaves correctly, which is why one import proves nothing:

```ts
// boom.ts:  export const BEFORE = 1; const _ = explode(); export const AFTER = {};
await import("./boom.ts");             // REJECTS: "top-level failure"
const mod = await import("./boom.ts"); // RESOLVES
Object.keys(mod);                      // THROWS: Cannot access 'AFTER' before initialization
```

`fd57e83c` fixed it by accident: softening `findContentRepoRoot` removed the
top-level throw, so nothing half-evaluates any more. The `findChecker` guard it
added in the same commit was attributed to a cycle it had not looked for.

### What was done

- `loadCheckerModule` caches the **failure**, so a checker file that will not
  load is imported once and reported once per criterion that names it. That is
  the repair, at the cause.
- The `moduleValues` guard **stays, and is not redundant**: a module registry is
  keyed by path and shared by the whole process, so a module some other caller
  already imported twice is poisoned before discovery ever sees it. Then the
  cache holds a namespace, not a failure, and only the guard stands between
  that and a crashed sweep.
- Both halves are pinned by `checker-module-load-failure.test.ts` and were
  falsified independently — removing either one fails exactly its own test and
  no other. The corpus is green and therefore proves neither, which is why the
  test runs against a fixture that throws.
- The comments in `qa-checker-discovery.ts` now say the real cause, and say in
  place that the cycle is not there.

### Not done, deliberately

The cycle detector is **not** shipped as a gate. It found nothing, twice, over
two tree states; a gate against a defect this repository has never had is a
gate whose green says nothing. The script is in the session scratchpad and the
method is written down above, which is what a future suspicion actually needs.

## Done when

- [x] The cycle is identified — **it does not exist**; the real cause is a
      second dynamic import of a module whose evaluation threw
- [x] It is broken, or declared acceptable with the reason written down — the
      cause is repaired by caching the load failure
- [x] The guard in `findChecker` is re-examined — it stays, for a reason that
      is now stated correctly and pinned by a test
