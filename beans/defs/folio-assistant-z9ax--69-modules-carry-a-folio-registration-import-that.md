---
# folio-assistant-z9ax
title: 69 modules carry a folio registration import that is now a no-op
status: in-progress
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

- [ ] The trigger and the test preload are identified and **excluded by name,
      with the reason on each**, before any sweep runs
- [ ] `test-preload.ts` is checked against the current mechanism rather than
      assumed redundant — it exists because five test files were order
      dependent, and automatic registration may or may not cover a preload's
      job
- [ ] Falsified: with the sweep applied, a fresh process importing only
      `readDeclaration` still resolves `folio`, and `bun test` still passes
- [ ] `isCompositionRoot` and the partition's composition-root rule are
      re-examined — they exist to permit exactly these imports, so if the
      imports go, the rule has no subjects left and should go with them

## Do not

Do not run a bare `grep | strip`. That is what was tried; it removed the
trigger.
