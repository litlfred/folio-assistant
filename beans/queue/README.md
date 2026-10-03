# Merge queue

What a merge steward **decided** about an open pull request — and nothing GitHub already knows.

One JSON file per pull request under consideration, each carrying
`"$schema": "folio-merge-queue-entry/v1"` and validating against `MergeQueueEntrySchema`
in [`cat-harness/schemas/merge-queue.ts`](../../cat-harness/schemas/merge-queue.ts).
Declared in [`../beans.json`](../beans.json) as the `merge-queue` node.

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
train run — a workflow instance of `Process_MergeTrain` under [`../workflows/`](../workflows/),
dated, recording only what the steward saw when it acted. A snapshot on a finished run is
history; the same value on a live queue entry would be a claim about now.

## Why it sits beside `workflows/`

The pairing is the point. **This** directory holds the decisions; a finished run next door
holds the evidence those decisions met. A reader asking *"why did #1899 go into that
train?"* needs both, and should find them in one store.

[`merge-train--train-6.json`](../workflows/merge-train--train-6.json) is the worked
example, and it carries a finding this queue exists to make visible: **five of that
train's eight members were red at their own heads, and the train landed green.** The reds
were generated-file staleness, which a train's single regenerate repairs. A per-member
gate would have refused five admissible pull requests.

## It is empty, on purpose

An entry records a decision a steward actually made, with its reason and its author.
Seeding one to make this directory look used would put a **fabricated decision** into the
graph that every later reader would take for a real one.

The order itself is never stored here either: it is **computed**, by
[`merge-priority.dmn`](../../cat-harness/processes/sdlc/decisions/merge-priority.dmn)
over live facts, so a stored rank is a decision's *input*, not the queue's answer.

The discipline is in the skill, not here —
[`skills/sdlc/sdlc-core/merge-queue.md`](../../cat-harness/skills/sdlc/sdlc-core/merge-queue.md).
