---
# folio-assistant-kacl
title: 'DETERMINISTIC-AND-AGENTIC: open question 2 now has a cited answer to argue with'
status: todo
parent: folio-assistant-ahvw
type: task
created_at: 2026-09-23T06:15:42Z
updated_at: 2026-09-23T06:15:42Z
---

skills/workflow/deterministic-and-agentic.md marks 'how much needs to be deterministic?' as open and probably malformed. The newly ingested Neubauer et al. (arXiv:2508.05192v2) proposes a different decomposition that the skill's three questions do not cover.

## What the skill says today

`skills/workflow/deterministic-and-agentic.md` is an **agenda, not a result**,
and says so. It carries the owner's research question of 2026-09-20 and marks
every claim **measured**, **decided** or **hypothesis**. Its question 2:

> **2. How much needs to be deterministic?**
> Open, and probably malformed as stated — see the three-way conflation above.

The conflation it names is real and stays right: *who decides* the branch,
*what happens if the decision is wrong*, and *who enforces* are three questions,
and an answer that does not say which it means is not an answer.

## What the new source adds

`library/arxiv-2508.05192v2`, ingested 2026-09-23, rendered as
`methodologies/hybrid-llm-deterministic.md`. It proposes a decomposition the
skill's three questions **do not cover**, and that is the point of this bean:

> **What is the model's output — the RESULT, or a RULE that is then validated
> and executed deterministically?**

That is a fourth axis. All three of the skill's questions can be answered
identically for two designs that differ on it, and the two designs have very
different failure profiles: a bad result must be caught by inspecting every
item, a bad rule is caught once, before it runs at any volume.

It also supplies something the skill's §"three questions" currently lacks
entirely — **cited evidence that the guarding is necessary**, rather than
assumed. Three findings, second-hand through the source and marked as such:
models are distracted by irrelevant context (Shi et al.), lose accuracy on
low-probability inputs even for deterministic tasks (McCoy et al.), and degrade
with input length *before* the context window is reached (Levy et al.).

That last one bears directly on the skill's own practice. The skill discusses
a "controlled overlay of context and memories" as question 3 and treats context
as something to hold constant. Levy et al. says context LENGTH is itself a
variable affecting the outcome — so an overlay comparison that varies content
while letting length vary with it confounds the two.

## What to do, and what NOT to do

**Do not rewrite the agenda into a conclusion.** The skill's own opening warns
that *"a research note that reads as though the question were settled is worse
than none, because the next agent stops looking."* One ingested tool paper
reporting no evaluation does not settle anything — and `hybrid-llm-deterministic`
§"Where this rendering stops" records that the paper's application example is a
demonstration with no baseline, accuracy measure or comparison.

So the edit is: **add the fourth axis as an axis, cite the three findings as
evidence for the premise, and mark them exactly as the skill marks everything
else.** The hypothesis stays a hypothesis.

## A testable prediction worth recording while it is cheap

The skill's existing hypothesis is that judgement is admissible where a wrong
branch is **recoverable**. The rule/result axis suggests a second, and it is
checkable against this repository rather than in the abstract:

> Where the output is a RULE, judgement is admissible at a point the
> recoverability criterion would refuse — because validation happens before
> execution rather than after.

The `relaxable="false"` five are the sample the skill already proposes for
testing the first hypothesis. They can test this one at the same time: ask of
each whether its output is a result or a rule.

## Done when

- [ ] The rule/result distinction is in the skill as a fourth axis, not folded
      into the existing three.
- [ ] The three cited failure modes appear as evidence for the premise, marked
      second-hand, pointing at `hybrid-llm-deterministic` for provenance.
- [ ] The context-length confound is noted against question 3.
- [ ] Every addition carries measured / decided / hypothesis, and the open
      questions are still open.
