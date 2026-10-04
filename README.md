# `cat/cat-harness/merge-queue` — the merge queue's store

This branch holds the **`merge-queue`** subgraph of `litlfred/folio-assistant`: a merge
steward's **decisions** about open pull requests, one JSON file per pull request under
`beans/queue/`, each carrying `"$schema": "folio-merge-queue-entry/v1"`.

It is **authoritative** — `manifest.json` says so, and that file is the authority, not this
paragraph. `main` no longer tracks `beans/queue/`.

## Why the queue is not on `main`

An entry on `main` arrives only through a pull request, and the merge steward does no
development work: the owner has ruled that it must not open PRs of its own, because that
has it setting its own priority in the queue it manages, spending the CI the queue is
starved of, and judging its own head.

So the one actor whose decisions this graph records was the one actor that could not write
to it, and `beans/queue/` held no entry at all. The branch store removes the pull request
from the path: a steward writes an entry the moment it decides, and
`bun run state:push --id queue` splices it onto this tip.

## How to read and write it

```sh
bun run state:mount          # every declared tip-keyed graph, this one included
bun run merge:queue:read     # the queue's entries, with the four read states kept apart
bun run merge:queue:record   # record one decision  (steward)
bun run state:push --id queue
```

A **read that cannot reach this branch THROWS** rather than reporting an empty queue. "No
decisions recorded" and "could not reach the store" are different answers, and a reader
that renders them the same prints *all clear* over a graph it never saw — bean `dh4f`.

## What a write is

A splice: only the paths that changed, grafted onto whatever this tip is now, every other
file carried across by id, each change carrying the blob id its author read (`expect`). A
sibling steward who edited the same entry since gets the write stopped as a **conflict**
with the path named, and nothing is pushed. Never a force push.

## What is NOT stored here

Any fact GitHub owns — CI status, mergeability, labels, the head SHA, the changed-file
list. Those are read live at decision time and are refused **by name** by the entry schema,
because a stored copy is a second answer to a question GitHub already answers and goes
stale on the next push. The discipline is in the skill:
`cat-harness/skills/sdlc/sdlc-core/merge-queue.md` on `main`.

Bean `folio-assistant-najo`, under the merge-pipeline epic `folio-assistant-hfag`. The
pattern is arc `folio-assistant-fs43`'s (`cat/cat-harness/beans`, `cat/cat-harness/todos`).
