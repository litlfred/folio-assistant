---
# folio-assistant-8rwa
title: 'LIT REVIEW: evidence-based literature review as a dispatched, untainted step in guideline development — WHO living guidelines'
status: todo
type: task
priority: high
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

Owner, 2026-09-21: *"need lit review, put this also as part of workflow for
evidenced based literature review as part of guideline development process (see
who living guidelines)."*

## Why it is the same mechanism

A **living guideline** is continuously updated as evidence appears, rather than
revised on a multi-year cycle. That makes evidence surveillance a *recurring
dispatched step* rather than a one-off literature chapter — which is exactly the
shape `0grh` describes, with the domain swapped:

| `0grh` | here |
|---|---|
| producer | whoever drafts the recommendation |
| checker, given the artefact and nothing that would let it shortcut | a search/appraisal step given the question, not the draft's conclusion |
| adjudicator, given the intent and the checker's output | the evidence-to-decision judgement |

And the owner's central rule holds with more force here than in code: **the
party that drafted the recommendation does not get to write the evidence
appraisal for it.** That is not a platform invention — it is why guideline
methodology separates the systematic review team from the guideline development
group in the first place.

## What this bean must establish before anything is built

The repository's content types already include WHO SMART Guideline IGs, so this
has a real home. But the platform must not acquire one guideline's methodology
as a built-in — read
[`domain-fencing`](../../cat-harness/skills/graph-management/domain-fencing.md)
first, and apply its three questions to every rule this would add. A folio's
methodology is a folio's, correctly located, and the honest move is to fence it
and say so.

## Done when

- [ ] The recurring-surveillance shape is expressed against `0grh` rather than
      as a parallel mechanism
- [ ] Each candidate rule is run through `domain-fencing`'s three questions, and
      anything that fails all three is fenced behind an opt-in axis, not shipped
      on the platform's default path
- [ ] The separation-of-parties rule is stated where a guideline author will
      find it, and is the SAME rule as `a58y` enforces for code — one rule, two
      instances
- [ ] Nothing asserts an empirical or clinical claim on the platform's behalf;
      the mechanism carries process, the folio carries evidence
