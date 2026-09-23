---
# folio-assistant-kacl
title: 'DETERMINISTIC-AND-AGENTIC: open question 2 now has a cited answer to argue with'
status: completed
type: task
priority: normal
created_at: 2026-09-23T06:15:42Z
updated_at: 2026-09-23T10:10:16Z
parent: folio-assistant-ahvw
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

- [x] The rule/result distinction is in the skill as a fourth axis, not folded
      into the existing three.
- [x] The three cited failure modes appear as evidence for the premise, marked
      second-hand, pointing at `hybrid-llm-deterministic` for provenance.
- [x] The context-length confound is noted against question 3.
- [x] Every addition carries measured / decided / hypothesis, and the open
      questions are still open.

## Summary of Changes — 2026-09-23

### The falsifier was run before writing, and did not fire

The bean proposed a fourth axis; the thing that would have killed it is the
axis being a restatement of *who decides*. Tested against the page's **own**
worked case rather than in the abstract:

> The commit boundary is agentic on *who decides* and deterministic on *who
> enforces*, and what the agent produces there is a **result** — a commit,
> checked after the fact. The source's schema-mapping design gives the same two
> answers and produces a **rule** — an expression, checked, then run.

Same answers on all three decision axes; incomparable failure profiles. A bad
result must be caught per item; a bad rule is caught once, before it runs at
volume. So it is a fourth axis and does not fold in.

### What changed

- **The conflation list is four items**, not three. Its hedge — *"At least
  three questions"* — turned out to have been doing real work, and the note now
  says so: a fourth arrived from outside the repository, and the hedge stays
  because the list is what has been noticed, not what exists.
- **§"A fourth axis"**, carrying the falsifier test above, a testable
  hypothesis (judgement is admissible where §1 would refuse it, WHEN the output
  is a rule), and an explicit §"What it does not settle" — including that
  "rule" may not even be well-defined for a `folio:raci` annotation.
- **§"Why the guarding is needed at all — cited, not assumed"**: the three
  findings (Shi, McCoy, Levy), each marked **second-hand** with
  `hybrid-llm-deterministic` as provenance, and a statement that the source is
  a tool paper with no baseline, so nothing rests on its performance.
- **Question 2's better-formed version gained the fourth clause**, with the
  reason it changes rather than lengthens the question.
- **Question 3 gained a confound it did not know it had.** Levy et al. report
  degradation with input LENGTH, so "the same task with and without this memory
  entry" varies content *and* length at once. The overlay bullet treats context
  as something to hold or release; length moves whenever either does.

### What was deliberately NOT done

**No question was closed, and none was rewritten as answered.** The page's own
opening says a research note reading as settled is worse than none. One tool
paper reporting no evaluation settles nothing, and the additions are an axis
and an evidence base — not a result.

`bun run gates` — 133/133.
