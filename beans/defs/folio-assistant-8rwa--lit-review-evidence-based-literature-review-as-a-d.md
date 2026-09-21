---
# folio-assistant-8rwa
title: 'LIT REVIEW: evidence-based literature review as a dispatched, untainted step in guideline development — WHO living guidelines'
status: in-progress
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

- [x] The recurring-surveillance shape is expressed against `0grh` rather than
      as a parallel mechanism — and the **gap is stated rather than papered
      over**: the spine's `field_hash` covers inputs in the repository, and an
      external evidence base is not one. What the two share is the shape a
      consumer must respect either way
- [x] Each candidate rule is run through `domain-fencing`'s three questions —
      seven rules, **three earn a place and four are fenced** (table below)
- [x] The separation-of-parties rule is stated where a guideline author will
      find it — `skills/folio-core/evidence-review.md`, bound to `qc-reviewer`
- [x] Nothing asserts an empirical or clinical claim on the platform's behalf.
      **Nothing is shipped for the four fenced rows either**: declaring empty
      criteria for them would be `dh4f` exactly — a consumer scanning nothing
      and reporting a clean run over it

## The fencing analysis

| candidate rule | Q1 | Q2 | Q3 | verdict |
|---|---|---|---|---|
| appraiser ≠ drafter | survives | vocabulary | no | **platform** — it IS the spine |
| a verdict carries what it was verified against, and when | survives | vocabulary | no | **platform** |
| a finding is upheld by opening the cited source | survives | vocabulary | no | **platform** |
| GRADE certainty domains | no | mechanism | yes | **fence** |
| PICO question formulation | no | mechanism | yes | **fence** |
| evidence-to-decision tables | no | mechanism | yes | **fence** |
| a search strategy is re-runnable | rationale only | bibliographic mechanism | yes | **fence the mechanism, keep the rationale** |

## The useful finding

**The platform did not need a rule for evidence review. It needed to notice
that the rule it already had was the same one.** Guideline methodology
separates the systematic review team from the guideline development group for
exactly the reason `0grh` gives, and has done so far longer than this
repository has existed.

## Where the boundary sits against what main just gained

`who-style-guide/skills/voices/who-guideline-development` states its own limit:
*"This voice governs the language of normative statements, not the process that
produces them — the process is the handbook's subject and belongs in a
workflow, not a style rule."* This skill is on the other side of that line, so
the two do not overlap. It also already practises the spine's discipline from
its own direction: a finding is upheld by **opening the cited page**, never by
trusting the rule's wording.
