---
# folio-assistant-7rna
title: 'PROCESS DEFINITIONS: 16 of 61 diagrams have no process-level <documentation>, and sqtq made that visible'
status: completed
type: task
priority: normal
created_at: 2026-09-22T07:23:40Z
updated_at: 2026-09-22T08:18:50Z
parent: folio-assistant-2upx
---


Found 2026-09-22 while adding the `glossary` auto-doc type. Not a new defect —
a pre-existing authoring gap that became **visible and then actively harmful**
two days ago.

## The mechanism

`gen-docs-auto.ts`'s `index/processes` took the first `<documentation>` after
the `<process>` open tag as the process's summary. For a process carrying its
own documentation that is right. For one that does not, it took **the first
lane's** — and presented it as what the process is for.

| measured 2026-09-22 | |
|---|---|
| diagrams in the corpus | 61 |
| whose first `<documentation>` is NOT the process's own | **16** |
| what it belonged to instead | a `<lane>`, in every one of the 16 |

## `sqtq` is what made it bite

It was correct until 2026-09-20. Bean `sqtq` wrote **157 lane
`<documentation>` elements**, and every diagram whose process carried none
began borrowing its first lane's. Before that the lanes had no documentation,
so the regex found the process's own or nothing.

**A fix to one defect created another, and no gate noticed**: the index is
generated, and `docs:auto --check` compares the generated page against what
the generator would write — both wrong, both agreeing. `6tkl` again, one
artefact over.

## What has been done, and what has not

**Done** (this change): the extractor now takes the documentation only when it
is a DIRECT child of the process — whitespace and comments may sit between,
nothing else. The 16 now say *"no description in the artefact"*, which is the
third state said out loud rather than a borrowed answer.

**Not done**: writing the 16 process-level documentations. That is authoring,
exactly what `sqtq` was for lanes, and it wants the same treatment — a check
that counts it, then the writing, then the check in the gate set so it stays.

## Why a process's own documentation is worth having

A lane's documentation answers *"what is this persona accountable for here"*.
A process's answers *"what is this whole thing FOR, and when would I be in
it"* — the question a reader of an index actually has, and the one the
docs-auto handler's own header says the index deliberately does not answer on
its own (*"an index is not the documentation"*). With 16 of 61 blank, a
quarter of the index cannot even start that sentence.

## Done when

- [ ] a check counts diagrams whose `<process>` carries no `<documentation>`
      of its own, reporting rather than gating until the number is zero
- [ ] the 16 are written — what the process is for, when you would be in it,
      and what it is not
- [ ] the check joins the gate set, so a new diagram cannot land undefined
- [ ] `docs:auto`'s index shows a real summary for every process

Related: `sqtq` (the lane documentations, which surfaced this), `lqo9` (the
glossary type whose work found it), `6tkl` (a check that cannot fail),
`check:lane-documentation` as the shape the new check should copy.

## SHIPPED 2026-09-22 — 16 of 61 became 61 of 61

Both halves, in the order the bean named them.

### The check

`scripts/check-process-documentation.ts`, the sibling of
`check-lane-documentation` one level up: that one asks whether a swimlane says
what its persona is accountable for, this asks whether the PROCESS says what
the whole thing is for.

It REPORTS by default and gates on `--strict`, which is the pattern
`check-lane-documentation` earned its place with: it reported 0 of 157 first,
the documentation was written, and only then did red mean something. A gate
landing red on 16 known blanks is a gate somebody switches off.

Three properties it carries beyond counting:

- **`(?:bpmn:)?` on every element.** Three readers had the prefixed blind spot
  before this one was written; a fourth would have reported 60 of 60 over a
  corpus of 61.
- **An empty corpus is exit 2**, never a pass. No processes found means the
  scan broke, and calling that "every process is documented" is `6tkl` in the
  check written to prevent it.
- **It names what the index USED to borrow** — `(the index used to borrow its
  <lane>'s)` — so a reader sees the substituted answer rather than taking the
  claim on trust.

### The 16

Written, each saying what the process is FOR, when you would be in it, and
what it is NOT — the bean's own framing, and the question a reader of the
index actually has. Ordered by activity count, largest first:
`content-change-review` (23), `human-translation-workflow` (16),
`code-change-review` (11), `translation-workflow` (9), `activity-log` (8),
`bean-lifecycle` (8), `board-open-close` (7), `session-state-machine` (7),
`actor-role-administration` (6), `review-narrative` (6), `voice-review` (6),
`board-relocate` (5), `qa-report-signing` (5), `review-task` (5),
`review-code` (4), `board-place-note` (3).

Each was written from the diagram — its lanes, its gateways, its end states —
rather than from its name. Several of the definitions are about the thing the
diagram exists to hold rather than the steps: `board-place-note` is about the
note carrying no coordinate, `board-relocate` about the order of the two
writes, `review-task` about the accept-or-send-back decision living in one
lane and nowhere beneath it.

### It is translatable, and the templates were re-extracted

**1668 → 1684 strings across 58 diagrams.** The definitions are `.pot`
msgids like every other diagram string, so they reach all five locales'
catalogues with nothing further to wire — the same property `sqtq` established
for the lane documentations.

### Done when — status

[x] a check counts diagrams whose `<process>` carries no `<documentation>` of
    its own, reporting rather than gating until the number is zero
[x] the 16 are written
[x] the check joins the gate set — `--strict`, so a new diagram cannot land
    undefined
[x] `docs:auto`'s index shows a real summary for every process — 0 entries
    say "no description in the artefact", down from 32

### Not done

Nothing on this bean. The related authoring question it does NOT cover: a
process's documentation is now required, but nothing checks that it says
anything USEFUL — the same limit `check-lane-documentation` has, and the same
reason: a gate on prose quality is a gate on judgement.
