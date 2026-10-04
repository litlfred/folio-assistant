# Merge queue

What a merge steward **decided** about an open pull request — and nothing GitHub already knows.

One JSON file per pull request under consideration, each carrying
`"$schema": "folio-merge-queue-entry/v1"` and validating against `MergeQueueEntrySchema` in
[`cat-harness/schemas/merge-queue.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/merge-queue.ts).
Declared by the `queue` entry in
[`beans/beans.json`](https://github.com/litlfred/folio-assistant/blob/main/beans/beans.json),
whose `source` names **this branch** — so this directory, not `main`'s, is the graph.

## Decisions are stored; facts are read live

| stored here — a decision | read live, never stored — GitHub's fact |
|---|---|
| priority class, rank or override position | CI status of the head |
| the reason, who decided, and when | mergeability |
| a hold, with its expiry | labels |
| the train it was assigned to | the head SHA |
| an ejection, with its evidence link | the changed-file list |

A stored copy of a GitHub fact is a second answer to a question GitHub already answers,
and it goes stale the moment anybody pushes. The schema enforces this structurally: the
object is `strict`, and the keys a well-meaning writer would reach for first are refused
**by name**, with the rule as the message rather than as an anonymous "unrecognised key".

**The one place a fact may be written down** is an evidence snapshot on a *finished*
train run — a workflow instance of `Process_MergeTrain` under `beans/workflows/` — dated,
recording only what the steward saw when it acted. A snapshot on a finished run is
history; the same value on a live queue entry would be a claim about now.

## Why it is on a branch, and `workflows/` is not

The pairing used to be the argument for this directory's place: the queue holds the
decisions, a finished run next door holds the evidence those decisions met, and a reader
asking *"why did #1899 go into that train?"* needs both.

That argument did not survive the measurement. `beans/queue/` held **no entry at all**,
because an entry on `main` arrives only through a pull request and the merge steward does
no development work — it must not open PRs of its own, which would have it setting its own
priority in the queue it manages, spending the CI the queue is starved of, and judging its
own head. The pairing cost the graph every one of its nodes.

So the queue moved first, on its own branch, while `beans/` is still cut over by arc
`folio-assistant-fs43` (beans `9ofm`, `p3ny`). When that lands, both graphs are one
`bun run state:mount` away from each other again, each on the branch its own declaration
names — which is the owner's D4 (b) ruling, 2026-10-03: *"Keep per-graph branches"*.

## The order is not stored here either

It is **computed**, by
[`merge-priority.dmn`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/processes/sdlc/decisions/merge-priority.dmn)
over live facts, so a stored rank is a decision's *input*, not the queue's answer.

## An empty queue and an unreachable one are different answers

`bun run merge:queue:read` keeps four states apart — `absent`, `declared-but-absent`,
`unreachable`, `read` — and **throws** rather than returning an empty list for the third.
A reader that renders "nothing is mounted here" as "no decisions recorded, all clear" and
exits 0 is bean `dh4f`, and the remedy it would print (*create the directory*) is the wrong
one: the remedy is `bun run state:mount`.

The discipline is in the skill, not here —
[`skills/sdlc/sdlc-core/merge-queue.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/merge-queue.md).
