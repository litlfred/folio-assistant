---
# folio-assistant-3vc1
title: A nested bun install makes root tsc report 12 errors that CI does not have — and it is the only way to fix a stale nested lockfile
status: todo
type: task
priority: normal
created_at: 2026-09-26T17:25:05Z
updated_at: 2026-09-27T06:14:56Z
parent: folio-assistant-1xhc
---

## The trap, measured 2026-09-26

`cat-harness/adapters/mcp-server/bun.lock` was stale against its own manifest, so
fixing it means `bun install` **in that directory** — there is no other way to
regenerate a lockfile. That install creates a 56 MB
`cat-harness/adapters/mcp-server/node_modules`, and from that moment the ROOT
`bunx tsc --noEmit` reports **12 errors across 3 files under
`cat-harness/adapters/mcp-server/tools/`** and `bun run gates` reports a red it
did not have before.

    with that node_modules present   12 errors, all under mcp-server/tools/, 0 elsewhere
    with it moved aside              0 errors — no source change whatsoever
    CI on the identical commit       tsc --noEmit step: SUCCESS

**Cause.** That directory's lock resolves `@modelcontextprotocol/sdk` to
**1.28.0**, which wants zod 3 and gets `zod@3.25.76` nested under it, while the
root hoists the manifest's zod 4. The root `tsconfig.json` includes those adapter
sources, so `tsc` type-checks them against whichever SDK resolution it finds
first. CI installs only from the root — SDK 1.30.0 — and exits 0.

Verified from the nested package itself:
`node_modules/@modelcontextprotocol/sdk/package.json` reads `"version": "1.28.0"`.

## Why it is worth a bean rather than a shrug

The 12-error symptom is already recorded on a sibling's bean `x89e`
("A standalone mcp-server install does not type-check, and that predates this
bump"), independently measured, same 12, same cause. **What is NOT recorded
anywhere is that it is a TRAP**: the only way to fix a nested stale lockfile
leaves the local gate set lying for the rest of the session, and nothing warns
you. It cost a full `bun run gates` cycle here, and the false red came with two
extra `bun test` failures alongside it, so the reading was wrong in three places
at once and none of them named a `node_modules`.

This is the third sibling of one shape, and the other two are already beans:

| bean | the residue | what it distorted |
|---|---|---|
| `xd1g` | `block-qa-schema/node_modules` + `dist` | `kg-detangle` counted 1214 phantom KG nodes |
| `qook` | a SYMLINKED root `node_modules` | `gitCorpus` handed every consumer one phantom path |
| this | a nested REAL `node_modules` | root `tsc` resolves a different SDK and reports 12 errors |

Each one is "a tool answered a question about the repository and the answer came
from something the repository does not contain".

## Options, none chosen here

1. Exclude `cat-harness/adapters/mcp-server` from the root `tsconfig.json` —
   cheap, and it drops that adapter from root typechecking, which is coverage
   lost rather than a fix. `block-qa-schema/tests` was excluded for a comparable
   reason and the residual gap was STATED rather than closed.
2. Bump that directory's `@modelcontextprotocol/sdk` to the root's version, which
   `x89e` names as the likely fix. Not a dependency PR's business, per that bean.
3. Have `gates` DETECT the condition and refuse with a reason — the
   `check:merged` pattern from `nytj`: a distorted environment is exit 2, could
   not determine, never a red. This is the one that generalises over all three
   rows of the table above.
4. Nothing, and record the trap so the next agent recognises the symptom.

## Done when

- [ ] the owner has chosen between excluding, bumping, detecting, or recording
- [ ] whichever is chosen, the 12-error reading can no longer be mistaken for a
      finding about this repository's source


## Option 3 — DETECT — implemented 2026-09-27

### Which option, and on whose say-so

The owner was offered four items of work and chose this one as *"Fix `3vc1`
durably — a real fix (or a committed guard) beats a parked directory and a warning
note."* That is read as **option 3, detect and refuse**, which is also the one this
bean already said *"generalises over all three rows"*. **If option 1 (exclude) or 2
(bump) was meant instead, this is cheap to swap** — the guard is one script and one
call site, and nothing else depends on it.

### A correction to this bean's own figure

It said **"12 errors across 3 files"**. Re-measured by restoring the nested install
deliberately: **12 errors across 6 files** — `render.ts` 4, `validate.ts` 3,
`lean.ts` 2, then `preview.ts`, `preferences.ts` and `check-deps.ts` one each. The
error count was right and the file count was not.

### The predicate was WRONG the first time, and the false positive was worse than the defect

The first version reported **every nested `node_modules`** as a distortion. Caught
before it shipped, by running it:

    ✗ cat-harness/adapters/mcp-server/node_modules       46 packages shadowed
    ✗ cat-harness/schemas/block-qa-schema/node_modules    2 packages shadowed

`block-qa-schema` is a **declared sub-package with its own `bun.lock` and
`package.json`** — its `node_modules` is the expected result of installing it. A
guard that refused on it would have blocked `bun run gates` in a correctly set-up
checkout, which is a worse defect than the one being guarded, and it would have
looked like it was working.

**"Inside the root `tsconfig.json`'s `include`" does not discriminate either.** Both
directories are inside it (`cat-harness/adapters/**`, `cat-harness/schemas/**`) and
only one moves the typecheck.

What discriminates is measured:

| nested install | shadows | its own sources import it? | root `tsc` |
|---|---|---|---|
| `adapters/mcp-server` | `@modelcontextprotocol/sdk` 1.28.0 vs 1.30.0 | **yes**, 4+ files | **12 errors, 6 files** |
| `schemas/block-qa-schema` | `typescript` 7.0.2 vs 6.0.3, `commander` 4.1.1 vs 8.3.0 | **no** | 0 errors |

So the rule is: **a nested install is a distortion exactly when it shadows a package
the sources beside it import.** Narrowing to that took the mcp-server report from
"46 packages shadowed" to the one that is the actual cause.

### What landed

`cat-harness/scripts/check-environment.ts`, plus `distortions()` called from
`gates.ts` BEFORE any gate runs. Exit **2**, never 1 (`nytj`): nothing it reports is
a finding about this repository's source, and `gates.ts` refuses the whole set rather
than reddening one, because 169 results computed against a lying filesystem are worse
than none — they look like evidence.

A **precondition, not a gate**, and deliberately in no workflow: CI installs only from
the repository root, so the condition cannot arise there and a step would be a gate
that can never fire. That reason is in `SCRIPT_EXEMPTIONS` rather than left for
`check:unrun-scripts` to trip over.

It also covers `qook` — a symlinked root `node_modules`, checked with `lstat` because
`stat` follows the link and reports the directory it points at, which is the exact
substitution being looked for.

### Verified, both directions

    with the nested install restored   exit 2, names @modelcontextprotocol/sdk 1.28.0 vs 1.30.0
                                       and root tsc simultaneously reports 12 errors
    with it parked                     exit 0, and SAYS it is ignoring
                                       schemas/block-qa-schema/node_modules rather than
                                       claiming there is no nested install

11 tests, mutation-tested twice — dropping the import predicate gives 2 fails,
reporting the root `node_modules` gives 2 fails. Two of them are anti-vacuity in the
awkward direction (`6tkl`): this repository must report NO distortion, or the guard
refuses for everyone, and it must still HAVE a nested install, or the
spare-the-sub-package case is only covered by fixtures.

### Still open, and not mine to close

Done-when #1 asked for the owner's choice between four options; this implements one on
a reading of their selection. Done-when #2 — *the 12-error reading can no longer be
mistaken for a finding about this repository's source* — is met for `bun run gates`,
which now refuses. It is **not** met for someone running `bunx tsc --noEmit` by hand:
that still reports 12 errors with no mention of a `node_modules`. Whether that matters
is a judgement about how people actually read this repository, so it is left stated
rather than decided.
