---
$schema: folio-methodology/v1
name: raci
title: RACI — who is involved in an activity, and in which of four ways
origin: >
  **NOT ESTABLISHED FROM ANY SOURCE HELD HERE, and that is stated rather than
  guessed.** RACI is a responsibility assignment matrix from project-management
  practice, but no primary text for it is ingested in this repository and none
  was reachable when this node was written. What is commonly cited — PMI's
  *PMBOK Guide* treatment of the responsibility assignment matrix, and the
  earlier Linear Responsibility Chart literature — is recorded in
  §"Its source is not held" as CANDIDATES TO FETCH, unverified, rather than
  asserted here as provenance. See `literature-search`.
applies-when: >
  **Who is involved in an activity, and how.** Use it when a process or a
  breakdown exists and the question is participation — who answers for this,
  who must be asked first, who is told afterwards. Not a decision method: a
  one-off choice among options is `kepner-tregoe`, a recurring rule is `dmn`,
  certainty of evidence is `grade`, the record of a decision is `madr`, and
  situation analysis before any of them is `swot`. RACI answers *who*, never
  *what* or *whether*.
---

# RACI — involvement, in four kinds

**Adopted on the owner's ruling, 2026-09-22** (bean `2xfl`): RACI is a
methodology, not a house practice, so it has a node here. Until that ruling it
existed only as a skill, and the methodology graph reported five nodes where a
reader might reasonably expect it to report this one too.

> ## ⚠ This rendering is not backed by a source
>
> Every other node in this graph names a text. This one cannot: **no RACI
> source is ingested here, and nothing is asserted below on a source's
> authority.** What follows is the method as this repository already applies
> it and as it is commonly understood — which is a weaker thing, and is marked
> as weaker on purpose.
>
> `check:methodology-evidence` reports this node as unbacked, correctly, and
> it will keep doing so until a source is ingested. **Do not remove that
> finding by adding a citation nobody fetched** — that is the exact failure
> `methodology-adoption` §"Never write a method from recall and cite a paper
> nobody fetched" names, and it would be worse than the gap, because a
> citation carries authority the text would not have earned.

## The four letters

| letter | means | direction |
|---|---|---|
| **R**esponsible | does the work | may be several |
| **A**ccountable | carries the decision; answers for the outcome | **exactly one** |
| **C**onsulted | asked for input **before** | two-way |
| **I**nformed | told **after** | one-way |

The axis that makes it a method rather than a list is **time and direction**:
C happens before and is a conversation; I happens after and is a broadcast.
Collapsing them turns consultation into notification, which is the failure the
letters exist to keep apart.

## Exactly one Accountable

The method's central constraint, and the one most often broken in practice. A
chart with two A's does not record a shared decision — it records that nobody
established who answers for the outcome, and it reads as complete while doing
so.

**Zero is also a breach**, once a row claims anything at all. A half-filled row
is worse than an empty one for the same reason: the chart looks answered.

**A row where the same party is both Accountable and Consulted is not a row
with two facts in it.** Asking yourself is not consultation, and that pairing
is how *consulted* becomes a formality while the chart still reads complete.

## What RACI is not

- **Not a decision method.** A is who answers for a decision, not how it is
  reached. Reaching it is `kepner-tregoe` or `dmn`; recording it is `madr`.
- **Not an approval gate.** Answering for an outcome and signing off on one are
  different acts, and a method that conflated them would let a chart stand in
  for a gate.
- **Not a permission model.** What a party may *do* in general is a different
  question from who is involved in this activity, and the two cross-cut.
- **Not a party registry.** RACI names roles in rows; it does not establish who
  exists. Something else has to say that first.

## Its source is not held

`literature-search`'s outcome 3, recorded so the next agent does not repeat the
search: nothing was found because nothing could be fetched. Measured
2026-09-22 — `doi.org`, `pmi.org` and every open-access aggregator fail through
this container's proxy; only `raw.githubusercontent.com` answers.

Candidates worth fetching, **unverified and listed as leads rather than as
provenance**:

| candidate | why it is a candidate | access |
|---|---|---|
| PMI, *PMBOK Guide* — the responsibility assignment matrix (RAM) | the most commonly cited formal treatment | not open access |
| The Linear Responsibility Chart literature (Cleland & King and successors) | commonly named as the earlier form RACI descends from | books, not open access |

**This puts RACI in the same bucket as `kepner-tregoe`:** the commonly cited
sources are books and paid standards, so no open-access primary exists to
fetch, and closing this gap needs either a copy or a decision to render from an
open secondary source — the route `swot` took. That is the owner's call, not an
agent's.

## How this platform applies it

**As an overlay on declarations that already exist**, never as a new table of
names — and R is *read* rather than declared, because a BPMN lane already says
who performs an activity.

That application, its three declared edge kinds, the `folio:raci` extension
element, the `check:raci` gate, and the procedure for running a RACI exercise
when initiating a project are in the skill:
[`skills/raci/raci.md`](../skills/raci/raci.md). The method lives here once;
the skill names it and does not restate it.
