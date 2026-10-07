---
# folio-assistant-ybp4
title: 'ADAPTERS CLOSURE step 2/2: adapters/document/ + its 6 consuming tests -> folio-assistant-core, escape axis 2 -> 0'
status: completed
type: task
priority: high
created_at: 2026-09-30T20:04:19Z
updated_at: 2026-10-01T08:15:15Z
parent: folio-assistant-vke6
---

Step 2 of the adapters closure planned in `r0tm`, **on the owner's ruling of
option A** (two PRs, paper first). Step 1 landed as `880b707f1da` (bean
`y5si`), so only the atomic half remained. This earns `yj6r`'s last unticked
box. PR #1687.

## What moved

**18 files**: the 12 under `cat-harness/adapters/document/` and the 6 consuming
tests from `cat-harness/scripts/tests/`. The tests moved WITH their subject —
see defect 3, which is the concrete reason that matters rather than a
principle.

## Two measurements, not one

`r0tm` §4 warned this move fails SILENTLY rather than loudly:

| | before | after |
|---|---|---|
| escape axis — `cat-harness` importing UP | 2 | **0** |
| typecheck program, adapters files | 24 | **24** (12 cat-harness + 12 core) |

The second is the guard. `r0tm` measured that **29 of 31** `.ts` files earlier
`yj6r` tranches moved up are OUTSIDE the typecheck program today, unreported
three times, because `tsconfig.json`'s `include` is per-directory and never
named the destinations. A green `tsc` covering twelve fewer files is the
failure mode, and no gate reports a shrinking program. Both numbers were
re-verified AFTER absorbing 77 commits of `main`, not carried over from before
the merge — and `main` was checked for churn on `adapters/document` across that
drift (none).

## Four sites that fail silently, all in one commit

- `tsconfig.json` `include` gains `folio-assistant-core/adapters/**/*.ts`
- `folio-assistant-core.json` declares `core-adapters`
- `BUILTIN_ADAPTERS`' document row — resolved by **variable** specifier, so no
  static-import gate would ever have caught it
- the 6 tests' import specifiers

## Three defects in my own rewrite, each found by measurement

1. **A single `../` was never in my depth rule**, which handled `../../` and
   deeper. `resolver.ts` imports `../manifest-entries.js` — a sibling of
   `document/` that did NOT move — so it resolved into core, where it does not
   exist. That one unresolved module made its exported types unresolvable and
   produced **fourteen** `Property 'subsections' does not exist` errors. One
   cause, fourteen symptoms. Before calling them mine I checked whether they
   were pre-existing errors newly REVEALED by added coverage: a worktree on
   `origin/main` proved `resolver.ts`, `index.ts` and `paths.ts` were already
   in the program. The fixer now resolves every specifier against the file's
   OLD location and repoints to what it MEANT, rather than guessing a depth.

2. **Dynamic `import("...")` was invisible to a `from "..."` regex.** Three in
   `render.ts`.

3. **`import.meta.dir` hops are invisible to EVERY import-path scan.** Neither
   typecheck nor any specifier rewrite could see them. `_pipeline.ts` computed
   the platform's `content/pipeline/` as three hops up — true while the module
   lived IN the platform, false the moment it did not. Caught only by
   `resolvePipelineScript("qa-sweep")` returning `undefined`.

   Its sibling `corePipelineDir` got SIMPLER: it used to hop out to the parent
   checkout and back down into `folio-assistant-core`, which its own comment
   called "the one place in this module that assumes the two instances are
   checked out beside each other" — the assumption #223 exists to remove. The
   module now lives in core, so that hop is gone from it.

## Two defects CI caught that my local run did not

`bun run gates` was interrupted three times by container churn, so it never
produced a verdict, and I pushed on a hand-picked subset — the exact failure
`AGENTS.md` names. Both CI failures were mine:

1. **`check:bean-bodies`** — this bean was `in-progress` with front matter and
   nothing else. Every measurement above was in the commit message and the PR
   instead of in the store a SIBLING reads. That is precisely the defect the
   check names, and it is why this section exists.
2. **`init-folio.test.ts`** — "the config selects the adapter matching the
   content type" pinned `./folio-assistant/cat-harness/adapters/document/index.ts`
   with `toBe`. It is `folio-assistant-core` now. Worth recording WHY it
   caught this: `y5si` replaced `toContain` with `toBe` full paths because a
   substring pin survived a wrong answer when `adapters/paper/` moved. That
   hardening earned its keep on the very next move — a substring pin on
   `adapters/document/index.ts` would have passed over this silently.

## `check:reference-direction` 87 -> 88, as predicted

`r0tm` said so in advance: the move must write the destination instance's name
into a `cat-harness/` file to say where the code went, and
`src/builtin-adapters.ts` is that file. Measured against a pristine
`origin/main` worktree: 87 there, 88 here — one file, mine, and the gate was
already failing. The GATED form (`--check`) passes: that gate records the
backlog and deliberately does not grade it, because "a gate that refused every
push until somebody drained a backlog is a gate switched off within a week".
`PENDING` was NOT grown — its own doc says a PENDING that only grows stops
meaning anything.

## What did NOT happen

**No schema moved down into `cat-harness/schemas/`.** `yj6r` forbids it as
buying a green gate by relocating the boundary the gate exists to protect. The
cheap fix was never reachable from this route.

## Done when

- [x] `adapters/document/` and its 6 consuming tests in `folio-assistant-core`
- [x] escape axis 2 -> 0, re-verified after the merge
- [x] typecheck program conserved, 24 -> 24, asserted rather than assumed
- [x] the four silent-failure sites in the same commit
- [x] `check:bean-bodies` and `init-folio.test.ts` fixed
- [x] CI green on the head that carries all of it (#1687 merged e3298fc5c66 on per-job verified green, per the 01MSKrDXE3 handover)


## Summary of Changes
adapters/document/ + 6 tests moved to folio-assistant-core in #1687 (e3298fc5c66), escape axis 2 -> 0, typecheck 24 -> 24. Closed 2026-10-01 by the separation arc (7x5n, S1 a4of) on that evidence.
