---
# folio-assistant-y5si
title: 'ADAPTERS CLOSURE step 1/2: adapters/paper/ -> folio-assistant-sci/, escape axis unchanged at 2'
status: completed
type: task
priority: normal
created_at: 2026-09-30T13:48:40Z
updated_at: 2026-10-01T08:15:14Z
parent: folio-assistant-vke6
---

Owner's Option A ruling on issue #1558 (2026-09-30), step 1 of 2.

Moves `cat-harness/adapters/paper/` (2 files) to `folio-assistant-sci/adapters/paper/`.
`adapters/document/` does NOT move: that is step 2, a separate PR, and doing it
here is what takes the axis through 16.

## Why step 1 is free

`adapters/paper/` reaches out of its own directory ONLY into
`adapters/document/` -- 7 edges (6 in index.ts, 1 in tools/lean.ts:22, the edge
the first plan missed), nothing else. Once paper/ is in sci and document/ stays
in cat-harness, all 7 become DOWNWARD edges, legal transitively via
`allowedFromNeeds` (sci -> core -> cat-harness -> bootstrap).

Escape axis: 2 before, 2 after.

## Must ship in the SAME commit -- each fails silently

- `tsconfig.json` `include` gains `folio-assistant-sci/adapters/**/*.ts` (bean lvoa)
- `folio-assistant-sci.json` declares `adapters/` with graphKinds [code]
- `BUILTIN_ADAPTERS` re-pointed
- `init-folio.ts:199` -- it COMPOSES the adapter path from contentType and
  cannot produce two instances; `init-folio.test.ts:216` pins a substring only

## Done when

- [x] 2 files moved, 7 specifiers rewritten
- [x] tsconfig include glob added, PROVED with a planted-type-error probe
- [x] folio-assistant-sci.json declares adapters/
- [x] BUILTIN_ADAPTERS re-pointed
- [x] init-folio.ts reads the path rather than composing it; test pins the full path
- [x] escape axis re-measured: 2 before, 2 after
- [x] bun run gates green, compared against origin/main in a clean worktree



## Carried out 2026-09-30 — PR #1599

Branch `claude/y5si-adapters-paper-to-sci`. Session
https://claude.ai/code/session_01NtKBtj6Yk4kSTVMX3z2Tgy

### Measured, not carried

Escape axis (`cat-harness -> folio-assistant-core`): **2 before, 2 after**.
Re-derived with a resolver over `git ls-files '*.ts'`, comments stripped so the
fenced `switch` sample in `src/builtin-adapters.ts`'s docblock is not counted as
an import, and `needs` read out of each `<instance>.json` rather than assumed.

`adapters/paper/` carries **8 specifiers, 7 of which leave the directory** and 1
of which is internal (`./tools/lean.js`). The plan's correction of 6 -> 7 holds:
the seventh is `tools/lean.ts:22` -> `../../document/paths.js`, reaching through
a TOOL rather than through the class extension. Each of the 7 was separately
checked to RESOLVE -- an unresolved specifier is skipped silently by the escape
counter, so "2 before, 2 after" on its own cannot tell a legal edge from a
broken one.

### The typecheck probe, run in BOTH directions

    with    folio-assistant-sci/adapters/**/*.ts in include  ->  TS2322, exit 1
    without it, same planted error                           ->  exit 0

The NEGATIVE control is the finding, not the positive one. `lvoa` records that a
file can be pulled into the program transitively by an included importer
(`cat-harness/tools/` is covered that way while named by nothing), so a glob
analysis over-reports and only the probe settles it. Here the glob is genuinely
load-bearing. Probe removed; typecheck clean.

### init-folio DID break

It composed the path from `contentType` against a hardcoded `cat-harness`, and
one template cannot name two instances. It reads `BUILTIN_ADAPTERS` now. The
test pinned a SUBSTRING the broken path still contains, so the gate could not
have caught it -- both paths are pinned in full now, plus a
non-default-link-path case that would catch an unnormalised `..`.

### Gate attribution, done rather than assumed

7 gates red on the branch, all 7 green on `origin/main` run in a separate
worktree -> mine. Regenerated with their own writers (`skill:register` twice, to
reach the fixed point it documents), never by hand-editing a generated file.

2 `bun test` failures were NOT mine: they read the CHECKOUT DIRECTORY'S NAME and
expect `folio-assistant`, while this session's isolated worktree is named
`agent-abd3b9d1e1508f539`. Proved rather than argued -- the same branch checked
out into a worktree NAMED `folio-assistant` passes both, and a baseline worktree
named `baseline` fails `instance-render` with `"baseline"` in the diff. Same
family as bean `vpek`.

### Decided beyond the plan

The plan's `sci-adapters` entry carried no `dependents`. Set to `skip`, on the
reasoning that a dependent gets its adapter by declaring a `contentType`
resolved through `BUILTIN_ADAPTERS` by variable path, rather than by inheriting
the directory to scan -- the same reasoning core's own `core-scripts` entry
uses. Flagged on issue #1558 as my judgement rather than the plan's, since
`reproduce` is a defensible alternative.

### Not done, deliberately

`adapters/document/` untouched (step 2). The `registerPaper*` misfiling inside
`adapters/document/` untouched, as the plan asked. The two dead TypeDoc steps
naming `adapters/paper/schemas/` were already dead before this PR; bean `u9r9`
covers them.


## Summary of Changes
Closed 2026-10-01 by the separation arc (7x5n, S1 a4of) on evidence: every box ticked, carried out in PR #1599, merged.
