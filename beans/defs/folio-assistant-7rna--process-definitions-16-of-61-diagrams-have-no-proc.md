---
# folio-assistant-7rna
title: 'PROCESS DEFINITIONS: 16 of 61 diagrams have no process-level <documentation>, and sqtq made that visible'
status: todo
type: task
priority: normal
created_at: 2026-09-22T07:23:40Z
updated_at: 2026-09-22T07:23:58Z
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
