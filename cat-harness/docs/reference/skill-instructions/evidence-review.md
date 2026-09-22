---
layout: default
title: 'Evidence review'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/evidence-review.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/evidence-review.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/evidence-review.md){: .fa-edit-source }

{% raw %}
# Evidence review — the same rule, a second instance

> Skill id: `evidence-review` · Capability: `quality-assurance` · Package: `folio-core`

This skill exists to demonstrate a claim rather than to assert it.
[`untainted-verification`](untainted-verification.md) states a discipline and
says it is generic. **One instance is an example; two unrelated ones are
evidence.** The first is the translation round trip. This is the second, and it
is as far from translation as the platform reaches: the appraisal of evidence
behind a recommendation.

## The rule is not a platform invention

> The party that drafted the recommendation does not write the evidence
> appraisal for it.

That is `untainted-verification`'s sentence with the nouns changed, and it long
predates this repository. Guideline methodology separates the **systematic
review team** from the **guideline development group** for exactly the reason
the spine gives: a party assessing its own output is comparing a thing with its
own paraphrase of itself.

Which is the useful finding here. The platform did not need to invent a rule
for evidence review — it needed to notice that the rule it already had was the
same one.

| `untainted-verification` | here |
|---|---|
| producer | whoever drafts the recommendation |
| **checker** — given the artefact, and nothing that would let it shortcut | the appraisal, given the question and the evidence, **not** the draft's conclusion |
| **adjudicator** — given the intent and the checker's output, never the artefact | the evidence-to-decision judgement |

Rule 1 of the spine has real teeth in this direction. An appraiser shown the
recommendation the guideline group has already drafted is being told the answer
before being asked the question, and a *"the evidence supports it"* produced
that way measures the instruction, not the literature.

## Recurring surveillance is staleness, generalised

A **living guideline** is continuously updated as evidence appears rather than
revised on a multi-year cycle. So the appraisal is not a one-off chapter — it
is a verdict with an expiry.

The spine already has that idea: a verdict is hashed to what it was about, so
editing the subject stales it. A living guideline stales the same verdict for a
different reason — **the subject did not change, the evidence base did.**

**That gap is stated, not papered over.** The spine's `field_hash` covers
inputs that live in the repository. An external corpus does not, and nothing
here pretends otherwise. What the two share is the shape a consumer must
respect either way: *"verified on DATE against THESE inputs"* is a different
claim from *"verified"*, and a reader given the second cannot tell a current
verdict from a lapsed one. Any folio implementing surveillance owes an explicit
expiry, in the same way [`bean-blocking`](bean-blocking.md) requires one on a
block: a verdict with no expiry cannot be told from an abandoned one.

## The fencing analysis — which rules are the platform's, and which are not

Run through [`domain-fencing`](../graph-management/domain-fencing.md)'s three
questions, in order, first-to-answer wins:

| candidate rule | Q1 rationale survives translation? | Q2 domain in mechanism or vocabulary? | Q3 needs the domain installed? | verdict |
|---|---|---|---|---|
| appraiser ≠ drafter | **yes**, word for word | vocabulary | no | **platform** — it IS the spine |
| a verdict carries what it was verified against, and when | **yes** — it is the `field_hash` argument | vocabulary | no | **platform** |
| a finding is upheld by opening the cited source, never by trusting the rule's wording | **yes** | vocabulary | no | **platform** — and already the practice in `voice-who-guideline-development` |
| certainty rated across the GRADE domains | no | **mechanism** | yes | **fence** |
| PICO question formulation | no | **mechanism** | yes | **fence** |
| evidence-to-decision framework tables | no | **mechanism** | yes | **fence** |
| a search strategy is re-runnable — databases, dates, query recorded | yes *in rationale* | **mechanism** is bibliographic | yes | **fence the mechanism**, keep the rationale (it is the row above) |

**Three rows earn a place on the platform and four do not**, and the four are
not a backlog. They are a folio's methodology, correctly located. The honest
move is to fence them and say so — which is what `q-usage-watcher` does in its
first paragraph, and what this table does here.

**Nothing is shipped for the fenced rows.** Declaring empty criteria for them
would be bean `dh4f` exactly: a consumer scanning nothing and reporting a clean
run over it. A folio that wants them declares them, in its own repository,
where its methodology lives.

## What this skill does NOT do

**It asserts no clinical or empirical claim, and the platform must not.** The
mechanism carries *process* — who may rule on what, given what. The evidence
is the folio's, the judgement is the guideline group's, and a platform that
shipped a default answer to either would be asserting on their behalf.

This is the same line `content-profiles` draws for block kinds and
`domain-fencing` draws for QA axes, arrived at from a third direction.

## Related

- [`untainted-verification`](untainted-verification.md) — the discipline. Read
  it first; this skill adds only what evidence review instantiates.
- [`translation-manager`](translation-manager.md) §"The agentic round trip" —
  the other instance, deliberately unrelated to this one.
- `voice-who-guideline-development` in `who-style-guide` — how a recommendation
  is **worded**. It states its own boundary: it governs the language of
  normative statements, *not the process that produces them*. This skill is on
  the other side of that line, and the two do not overlap.
- [`domain-fencing`](../graph-management/domain-fencing.md) — the three
  questions, and why a fenced rule is correctly located rather than missing.
{% endraw %}
