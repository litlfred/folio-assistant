---
# folio-assistant-30jr
title: 'hfag''s last three: declare the merge queue as a state graph, give it a viewer and tile, and record a train run'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T07:25:27Z
updated_at: 2026-10-03T07:25:36Z
parent: folio-assistant-hfag
---


## Brief

Owner, 2026-10-03: *"do the three open hfag items"*, then — when the tile turned out to be
blocked on an integrity constraint rather than on effort — *"1"* (ship the other two, leave
it open) *"and 3"* (surface the queue in the bean store rather than leaving it invisible).

## What landed

**The queue is a declared `state` graph.** Kind `merge-queue` in the registry — `holds: "state"`
by the one question `content-context-and-state-graphs` asks (a running process WRITES it),
`recordsWork: true` because a held entry is open work, and its validator wired to the SAME
export the steward's tooling imports so the kind and the writer cannot drift. Declared in
`beans/beans.json` at `beans/queue/`, beside `workflows/`: this holds the DECISIONS, a
finished run next door holds the EVIDENCE they met.

Both clauses of that box were verified by RUNNING the schema, not by reading it: an override
with no `reason` is rejected, and an entry carrying a GitHub fact is refused by name with the
rule as its message.

**Merge train 6 is recorded** as `beans/workflows/merge-train--train-6.json` — retroactively,
saying so as its first line, following `code-change-review--consolidation-956`. Every entry is
re-derivable from git log and the GitHub API. All 14 node ids verified to exist in
`merge-train.bpmn`; `Task_Bisect`, `Task_Eject`, `Call_EjectHandBack` and `Task_RetryFlaky`
were never reached and hold no token.

Its finding, derived from the check-runs API rather than recalled: **five of eight members
were RED at their own heads and the train landed green.** The reds were generated-file
staleness, which the single regenerate repairs; two were `cleanup` alone; #1928 carried only
THREE check runs. A per-member gate would have refused five admissible pull requests — which
is the premise of the whole train mechanism, now visible rather than asserted.

**The queue is surfaced** (owner's option 3): `beans/queue/README.md` documents the graph, and
`beans/README.md`'s subgraph index now lists `queue/` and links to it. Measured first: the
index skips a directory with no visible file, which is why an empty declared directory was
invisible to a reader of the bean store.

## What is open, and exactly what unblocks it

The harness tile. Not effort — an integrity constraint:

1. a tile links only to a page that EXISTS (`harness-tiles`: *a candidate with no page is
   reported, never linked*);
2. that page comes from `state-visualizer`, which renders one dashboard per INSTANCE-declared
   state directory;
3. declaring `beans/queue/` at instance level fails `check:kind-validators` —
   *"EXAMINED NOTHING — merge-queue declares nodeSchemas and no node was found"*.

That finding is TRUE. Measured: every other instance-declared graph has nodes (surveys 2,
notes 11, todos 5, issue-marks 3, interaction 2, memory 47). There is no precedent for an
empty one.

**It unblocks the moment a steward records one real queue entry.** Two ways NOT taken, and
the reasons are the point: seeding a fabricated decision would put a record into the graph
every later reader would take as real, and swapping `nodeSchemas` for a plain `validator`
would silence a correct finding by describing the kind LESS accurately — entries carry
`$schema: folio-merge-queue-entry/v1`, so `nodeSchemas` is the accurate shape.

## Follow-up this surfaced

`TrainMemberEvidenceSchema` is the declared shape for a finished run's per-member evidence,
and `InstanceState` has no field to carry it. The train-6 evidence therefore sits in
`history[].note` as prose — the existing store and schema the box asked for, but not
machine-readable and not checkable by any gate. Recorded here rather than fixed by inventing
an undeclared key.

## Done when
- [x] `merge-queue` declared as a `state` graph, with its validator and its home
- [x] an override with no reason rejected, and GitHub facts refused by name — both run, not read
- [x] merge train 6 recorded as a workflow instance, every node id verified
- [x] the queue surfaced in the bean store's own index
- [ ] the harness tile — blocked on the first real queue entry, above
- [ ] `TrainMemberEvidenceSchema` given a home on `InstanceState`, or a stated reason not to
