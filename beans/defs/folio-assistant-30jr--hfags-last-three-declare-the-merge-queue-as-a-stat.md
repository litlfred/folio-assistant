---
# folio-assistant-30jr
title: 'hfag''s last three: declare the merge queue as a state graph, give it a viewer and tile, and record a train run'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T07:25:27Z
updated_at: 2026-10-03T14:42:55Z
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


## Incoming insight from an open PR, 2026-10-03 — #2000 `merge-guard`

Watching the other open PRs while this one's CI ran turned up one adjacency worth
recording, and the measured part is small, so it is separated from the inference.

**Measured.** #2000 (`merge-guard`: "`merge:guard` is the single way a steward lands
a PR", bean `dqir`) currently contains exactly ONE file, its own bean, and that
bean's checklist carries:

    - [ ] merge-queue skill: merges go only through merge:guard; skill:register

So #2000 will edit the same `merge-queue` skill this PR registered. That is a known
future conflict in a known place, not a surprise to be discovered at merge time.

**Inferred, and flagged as inference.** #2000 looks like the natural site of the
FIRST REAL QUEUE ENTRY, because a tool that is the single way a steward lands a PR
is a tool that makes steward decisions. If so it unblocks this bean's one open box
on its own. But #2000 has no code yet, so this is read off its framing rather than
demonstrated by it, and nothing here should be planned on it.

**Why it matters to the open box.** The tile is blocked on
`check:kind-validators` refusing an instance-declared `beans/queue/` with
"EXAMINED NOTHING — merge-queue declares nodeSchemas and no node was found". The
second main merge of this PR regenerated `audit-coverage` and it now reports the
same gap from the other direction, independently:

    {"kind": "merge-queue", "state": "no-directory",
     "directories": [], "criteria": [], "subjectKinds": [], "gates": [],
     "typed": true, "hasFiles": false}

Typed, and judged by nothing: zero kg-audit criteria, zero declaring gates. By the
audit-coverage skill's own rule `typed-only` is ALREADY a finding, and
`no-directory` is weaker still. Two independent instruments, one gap — which is
what makes it a real finding rather than one gate's opinion.

Not fixed here. Giving `merge-queue` criteria and a declaring gate is new work with
its own decisions, and the box stays open and honest per the owner's 2026-10-03
ruling.

## Correction, 2026-10-03: `no-directory` is NOT a gap, and I said twice that it was

Earlier the same day I wrote — in a commit on this PR and in the section above —
that audit-coverage reporting `merge-queue` as

    {"kind": "merge-queue", "state": "no-directory", "criteria": [], "gates": [],
     "typed": true, "hasFiles": false}

was "a real gap", and that `no-directory` is "a weaker state than `typed-only`".
**Both claims are wrong**, and the skill that owns the report says so explicitly:

> | `no-directory` | no instance declares one of this kind | `bean-defs`, declared
> inside `beans/beans.json`, reached through its parent — and carrying 8 gates |
>
> `bean-defs` is why the first state is not a gap: it has coverage and no
> instance-declared directory.

`bean-defs` is the SAME SHAPE as `merge-queue` — declared inside `beans/beans.json`,
reached through its parent. The state says WHERE a kind is declared, not whether
anything judges it. I inferred severity from a state name instead of reading the
table that defines it.

What is true is the part that sat next to the error: `bean-defs` carries **8
gates**, `merge-queue` carries **0 criteria and 0 gates**. The emptiness of the
coverage is the finding. The state name never was.

## And that gap cannot honestly be closed yet

Giving `merge-queue` criteria now would mean a validator over zero nodes, which the
same skill forbids by name:

> **A validator over the nodes nobody produces is not coverage.**

`check-harness-state.ts` is where such a family would go — it declares
`@covers health, todos, interaction, issue-marks` and carries one family per kind —
and adding a fifth over an empty kind reproduces the `check:kind-validators`
refusal that already blocks the tile: *"EXAMINED NOTHING"*.

So this is not deferred for effort. **The precondition is the same first real queue
entry the tile waits on**, and until a steward records one there is nothing for a
criterion to have an opinion about. Both boxes unblock together, from one event.
