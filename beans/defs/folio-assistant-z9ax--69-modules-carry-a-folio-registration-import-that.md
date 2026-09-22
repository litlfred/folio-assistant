---
# folio-assistant-z9ax
title: 69 modules carry a folio registration import that is now a no-op
status: completed
type: task
priority: normal
created_at: 2026-09-22T06:29:45Z
updated_at: 2026-09-22T09:37:04Z
parent: folio-assistant-vke6
---

Left behind by `q2wn`, deliberately and with the attempt recorded.

## What is true now

`schemas/cat-harness.ts` imports `schemas/folio-graph-kind.js` at its foot, so
the `folio` kind is registered by the time any reader can be called — a reader
lives in that module, so loading it is a precondition of calling one. Proved
in a fresh process importing only `readDeclaration`.

That makes every OTHER `import "…/folio-graph-kind.js";` in the tree a no-op.
Measured 2026-09-22: **69 files** carry one.

## Why it was not done in `q2wn`

It was attempted and reverted, which is the useful part. A sweep stripping
every bare registration import took out **two load-bearing ones**:

- `schemas/cat-harness.ts` — the TRIGGER itself, the one import that must stay
- `schemas/test-preload.ts` — the `bun test` preload PR #465 added after five
  test files turned out to be import-order dependent

So "strip the redundant imports" is not the mechanical sweep it looks like: at
least two of the 69 are the mechanism rather than an instance of the problem,
and telling them apart needs reading rather than matching. A 69-file diff that
silently breaks the trigger would reintroduce the whole `#464` class while
looking like tidying.

## Done when

- [x] The trigger and the test preload are identified and **excluded by name,
      with the reason on each**, before any sweep runs
- [x] `test-preload.ts` is checked against the current mechanism rather than
      assumed redundant — it exists because five test files were order
      dependent, and automatic registration may or may not cover a preload's
      job
- [x] Falsified: with the sweep applied, a fresh process importing only
      `readDeclaration` still resolves `folio`, and `bun test` still passes
- [x] `isCompositionRoot` and the partition's composition-root rule are
      re-examined — they exist to permit exactly these imports, so if the
      imports go, the rule has no subjects left and should go with them

## Do not

Do not run a bare `grep | strip`. That is what was tried; it removed the
trigger.

## DONE 2026-09-22 — 74 removed, 2 kept by name, and a gate that was never built

`bun test` **6118 pass / 0 fail**, `gates` **115/115**, `playwright` **427 passed**.

### The count was 78 by grep and 76 in fact

My first measurement said 78. Two of those were **not imports**: a quoted
fixture in `partition-imports.test.ts` and a comment in `instance-rules.ts`
— one I had written the same day. Comments stripped, the real figure is **76
bare side-effect imports**, of which **2 are the mechanism** and **74 were
removed**. There is also 1 *bound* import (`registerFolioGraphKind`), a real
use, untouched.

That is the same "prose is not evidence" error this session already paid for
in `check-image-roles.ts`, where the gate's own doc comment made its corpus
look indeterminate.

### The two kept, by name, with the reason on each

- `schemas/cat-harness.ts` — **the trigger**, last in the file on purpose.
- `schemas/test-preload.ts` — the `bun test` preload.

### The check the bean did not name, and which was the real risk

The no-op argument rests on *"a reader lives in `cat-harness.ts`"*. That holds
only if each file actually reaches it. Checked: **73 of 74 import it
directly**, and the one that does not — `harness-config.test.ts` — reaches it
one hop out through `harness-config.ts:253`. No file touched
`graph-kind-registry` directly.

### Falsified BOTH ways

- A fresh process importing only `readDeclaration` resolves `folio` — with a
  **non-vacuity guard**, because the first version of that check printed
  "0 folio directories" and would have passed over nothing. The field is
  `graphKinds`, not `graphs`; my probe used the wrong name.
- **Remove the trigger** and the same process fails with exactly
  `unknown graph kind "folio"`, exit 1. Restored, exit 0. So the trigger is
  load-bearing and the 74 genuinely were not.

### The preload: checked the way the original bug was found

Not assumed redundant. The 2026-09-20 bug was found by running files **in
isolation**, because a full run was green by luck. Same method, preload
disabled: `kg-node` 14, `bootstrap-initialization-convention` 7,
`qa-results` 19, `todos` 14, `topology-conflicts` 18 — **all pass**. The full
suite is green without it too.

**Retained anyway, and that is a judgement not a measurement.** Its rationale
is superseded; removing it is a separate change whose failure mode is a future
test reading a declaration through a leaf. Its doc now says so rather than
stating a mechanism that no longer holds.

### `check:composition-roots` DOES NOT EXIST

`isCompositionRoot` lets a command cross a layer, and the safety argument for
a library omitting the registration was: *"`check:composition-roots` refuses a
command that READS a declaration without carrying the registration."*

**`bun run check:composition-roots` exits "Script not found."** That sentence
appeared in **seven** source files and in `partition/engine.ts`'s own doc. The
guarantee rested on a gate nobody built, and no gate failed to say so.

It is **moot rather than fixed**: #840 made the registration automatic, so no
command can forget it. All eight places now say that instead.

(And my first sweep of those comments corrected *five* — because I had read
the list through `head -5`. The seventh recurrence this session of a count
taken from a truncated or shape-matched view.)

### One consequence nobody would predict

All 8 library QA sidecars went stale. `buildQaResult` records
`script_hash: sourceHashOf(scriptAbsPath)`, and removing 11 lines from
`check-l1-complete.ts` changed its hash. Regenerated with
`check:l1-complete -- --write`: **only `script_hash` and `updated_at` moved,
no verdict changed** — 16 lines across 8 files. The mechanism working, not
breaking.

Established against `main` in a worktree before attributing it: clean `main`
passes that test 58/0, this branch failed 57/1, so it was mine.

## Summary of Changes

- 74 redundant `import "…/folio-graph-kind"` removed, each with the comment
  that explained it — a stale rationale is worse than none.
- The `#464` evidence (10 of 20 modules threw while every gate and 3298 tests
  passed) consolidated at the trigger, now its only home.
- `test-preload.ts` doc rewritten: rationale superseded, retention explained.
- Eight places corrected about `check:composition-roots`.
- 8 library QA sidecars re-attested.
