---
# folio-assistant-8ka1
title: 'COORDINATION: two files moved under sibling PRs'' feet — gen-bootstrap-graph.ts and repo-partition.ts'
status: completed
type: task
priority: normal
created_at: 2026-09-20T16:26:22Z
updated_at: 2026-09-20T19:09:25Z
parent: folio-assistant-vke6
---


## Why this is a bean and not a PR comment

The two moves below are invisible from the branches they affect. A sibling
reading its own diff sees a file it edited; it does not see that the file has
a different name on `main`. `bean-coordination` makes the bean store the
channel for exactly this, and a bean cannot be missed the way a comment on a
72-hour-old PR can.

Written in a bean NEITHER affected PR is editing, on purpose. Adding the note
to `hfkl` or `7po1` would have put it inside the diff it is warning about.

## 1. `scripts/gen-bootstrap-graph.ts` -> `scripts/gen-bootstrap-graph.ts`

Part of the `bootstrap` rename (owner instruction, 2026-09-20; PR #550).
The whole `bootstrap/` instance is now `bootstrap/`, and the generator
followed it.

**Affects PR #542** (`claude/wonderful-gauss-7frcrw`), which edits that file
at its old path. Git's rename detection usually carries a modify across a
rename, but it is worth knowing before the merge rather than during it.

The package script moved with it: `bun run bootstrap:graph`.

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


## The expiry condition this bean set is now MET — 2026-09-20

The bean's own instruction: *"Both affected PRs have merged or rebased past
these two changes. This bean is a NOTICE with an expiry, not work — scrap it
once #542 and #477 are through, and do not let it sit looking like a task."*

Both are through:

| | merged |
|---|---|
| #477 | 2026-09-20T18:18:43Z, by the owner |
| #542 | 2026-09-20T18:55Z |

**Recorded rather than scrapped**, because `bean-coordination` says never
resolve a sibling's bean and the owner has not yet ruled on `bbbl`, which is
exactly this collision: `0pes` says a bean closes on evidence rather than on
authorship, and bean-coordination says a sibling never closes one. This bean
is the cheapest instance of that disagreement — its author wrote the closing
condition down in advance, and it has come true.

Whoever owns it: the condition is met and the scrap is one command.

_Recorded by session_017PqeiS4JYySSWGAYLedmus, which merged both PRs._


## DISCHARGED 2026-09-21 — both warned-about PRs have landed

This bean is a NOTICE, not work. Its value is entirely in reaching a sibling
before that sibling's merge, so it expires when the merges happen rather than
when somebody does something.

| | |
|---|---|
| **#542** (`claude/wonderful-gauss-7frcrw`) — edits `gen-bootstrap-graph.ts` at its old path | **merged 2026-09-20T18:55:19Z** |
| **#544** — the `repo-partition.ts` split | merged, as this bean already recorded |

Both moves verified on the tree rather than taken from the note above:

```
gen-bootstrap-graph.ts        absent
gen-bootstrap-graph.ts    present
partition/engine.ts           present
partition/instance-rules.ts   present
repo-partition.ts             present   (the CLI, re-exporting)
```

And the distinction this bean was careful to draw held: **`pages-bootstrap.ts`
is still `pages-bootstrap.ts`** — the GitHub *Pages* bootstrap, a different
word, which a wholesale rename would have swept along with the other 87 files
carrying only the verb.

### Worth keeping rather than deleting

The mechanism is the part with a future: **a file move is invisible from the
branch it affects.** A sibling reading its own diff sees a file it edited, not
that the file has a different name on `main`. This bean was written in a third
bean neither affected PR was editing, so the warning could not arrive inside
the diff it was warning about.

That is the same blind spot this session hit five times from the other side —
building something a sibling had already landed. The guard for the read
direction is now
[`bean-coordination`](../../cat-harness/skills/folio-core/bean-coordination.md)
§"Re-derive from the REMOTE"; this bean is the WRITE direction, and there is
no skill line for it yet. Worth one if a third instance appears: **when you
move or rename a file a sibling branch edits, say so in a bean neither branch
is touching.**
