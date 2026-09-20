---
# folio-assistant-8ka1
title: 'COORDINATION: two files moved under sibling PRs'' feet — gen-bootstrap-graph.ts and repo-partition.ts'
status: todo
type: task
priority: normal
parent: folio-assistant-vke6
created_at: 2026-09-20T16:26:22Z
updated_at: 2026-09-20T16:26:22Z
---


## Why this is a bean and not a PR comment

The two moves below are invisible from the branches they affect. A sibling
reading its own diff sees a file it edited; it does not see that the file has
a different name on `main`. `bean-coordination` makes the bean store the
channel for exactly this, and a bean cannot be missed the way a comment on a
72-hour-old PR can.

Written in a bean NEITHER affected PR is editing, on purpose. Adding the note
to `hfkl` or `7po1` would have put it inside the diff it is warning about.

## 1. `scripts/gen-bootstrap-graph.ts` -> `scripts/gen-cat-bootstrap-graph.ts`

Part of the `cat-bootstrap` rename (owner instruction, 2026-09-20; PR #550).
The whole `bootstrap/` instance is now `cat-bootstrap/`, and the generator
followed it.

**Affects PR #542** (`claude/wonderful-gauss-7frcrw`), which edits that file
at its old path. Git's rename detection usually carries a modify across a
rename, but it is worth knowing before the merge rather than during it.

The package script moved with it: `bun run cat-bootstrap:graph`.

**NOT renamed, and the distinction matters:** `scripts/pages-bootstrap.ts` and
the `pages:bootstrap` script. That is the GitHub *Pages* bootstrap, a
different word. 87 files in this repository contain only the verb
("bootstrapping") or `pages-bootstrap`, and none of them was touched.

## 2. `scripts/repo-partition.ts` split (PR #544, MERGED)

The file was 1,194 lines: algorithm, this instance's exception data, and the
rationale for that data. It is now three:

    scripts/partition/engine.ts          the algorithm, no instance data
    scripts/partition/instance-rules.ts  REPOS, ALLOWED, RULES, scan roots
    scripts/repo-partition.ts            the CLI, re-exporting classify/analyse

**`RULES` is the one that bites.** Any edit adding a path to `RULES` now
belongs in `partition/instance-rules.ts`. Two PRs have already hit this:

- `d8f23d39a2` (bean `3pqn`) added `scripts/check-prs-have-runs.ts`; it was
  ported into the new file during #544's merge of main.
- **PR #542** edits `repo-partition.ts` and will need the same re-targeting.

`classify()` and `analyse()` keep their old names and old arity, so a caller
is unaffected — it is only edits to the DATA that move.

## What a sibling should do

Nothing pre-emptively. On a conflict in either file, the resolution is a
re-target rather than a choice between two versions: put the `RULES` entry in
`partition/instance-rules.ts`, and take the renamed path for the generator.

## Done when

Both affected PRs have merged or rebased past these two changes. This bean is
a NOTICE with an expiry, not work — scrap it once #542 and #477 are through,
and do not let it sit looking like a task.
