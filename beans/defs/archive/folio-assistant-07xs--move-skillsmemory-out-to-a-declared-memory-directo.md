---
# folio-assistant-07xs
title: 'MOVE: skills/memory/ out to a declared memory/ directory'
status: completed
type: task
priority: normal
created_at: 2026-09-20T05:35:24Z
updated_at: 2026-09-20T08:18:18Z
parent: folio-assistant-zzmr
---

The relocation `mhh9` implied and `fvnw`/`mgdg` deliberately deferred:
relocating a directory as a side effect of adding a classification is the
shape #395 refused and bean `auap` did as its own change.

## Summary of Changes

- `cat-harness/skills/memory/` -> `memory/`, 37 nodes, declared with
  `"scope": "repository"` and `graphs: ["memory"]`.
- **Repository scope, like `beans/`**: these are facts about this REPOSITORY
  carried by the agents working in it, and `.claude/agents/` — the consumers —
  sit at the repository root too.
- `MEMORY_DIRS` asked BY GRAPH KIND. It was
  `kgRoots(ROOT).map((d) => join(d, "memory"))` — right while the nodes lived
  under `skills/`, and finding nothing the moment they moved, since `kgRoots`
  filters to exactly-`cat-harness`. `directoryForGraph(ROOT, "memory")` is the
  question actually being asked and survives the next relocation.
- ~30 references updated, split into two groups rather than swept: LIVE
  pointers a reader would follow, and HISTORY about the defect that happened
  while the nodes were inside `skills/`. The history is kept — the file-level
  `isSkillMd` predicate exists because of it — with a note saying where they
  went, so nobody follows a path that is gone.

## A real bug found by the move

`writeDetail` sat AFTER the `unchanged` early return in `syncAll`. So when
`MEMORY.md` had not moved, the detail sidecars were never rewritten: a detail
block could change, or a generated header go stale, while the INJECTED comment
did not — and the generator reported "unchanged" over a sidecar that was not.
Two things an entry says, one of them checked.

It surfaced because every sidecar still named `skills/memory/` in its
generated header through **two** clean runs, both agents' `MEMORY.md` happening
to be unchanged. Exactly the case the bug hides in, and the only reason I saw
it is that I distrusted an "unchanged" I had a reason to expect to be
"written".

Sidecars now write whether or not `MEMORY.md` moved.

## Why the move was safe rather than urgent

Nothing ever depended on the DIRECTORY to tell a memory node from a skill —
`isSkillMd` reads the `$schema:` line, which is declaration-over-location and
still does the work. What the move fixes is the other direction: the
containing kind was `content` while its contents were `context`, and a nested
declaration is the defect #263 names.

## Done when

- [x] the nodes live in a declared directory of their own kind
- [x] the resolver asks by graph kind rather than composing a path
- [x] every live reference updated; the history kept and marked as history
- [x] the assembled `MEMORY.md` is byte-identical — verified, the move changed
      no output
- [x] 43 gates, 3157 tests
