---
# folio-assistant-q0tc
title: 'RESEARCH: the deterministic-to-agentic spectrum in workflow processing'
status: completed
type: task
priority: normal
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T07:26:24Z
parent: folio-assistant-5a3l
---

Owner, 2026-09-20:

> in test harness/deployment make a note that a spectrum of deterministic vs
> agentic bpmn state management/workflow processing can happen. goal of
> research - which are safety risks/how much needs to be deterministic? how to
> models compare cross different sub workflwos with a controlled/managemend
> overlay of context and memories.

## The framing question, answered first because it changes the note

**"Deterministic vs agentic" is not one axis**, and the note would have been
wrong if it had drawn one. At least THREE questions are conflated:

1. **who decides** the branch — a table, or a reading of intent
2. **what happens if the decision is wrong** — refused, noted, or nothing
3. **who enforces** — the agent asking, or a gate that does not care whether
   anyone asked

A step can be fully agentic on (1) and fully deterministic on (3): the commit
boundary is exactly that, an agent deciding freely and a hook refusing the
write regardless. So **any answer to "how much needs to be deterministic" that
does not say which of the three it means is not an answer** — and question 2
of the owner's three is, as stated, malformed. The note says so rather than
answering the wrong question tidily.

## What made this writable now rather than a day ago

Two measured inputs that did not exist before this session:

- `3nfv` made the corpus **countable** — `check:workflow-refs` prints
  computed / declared-judgement / undeclared for every exclusive gateway.
  Before `folio:judgement`, "no table because it is a judgement" and "no table
  because nobody wrote one" were indistinguishable.
- `mhh9` made **`context` a named layer**, so "the same task with and without
  this memory entry" is a thing that can be said. The owner's third question
  needs a controlled overlay of context and memories; naming the layer is the
  first requirement for controlling it.

## Summary of Changes

- `skills/workflow/deterministic-and-agentic.md` — the agenda. Every claim
  marked **measured**, **decided** or **hypothesis**, and there is more of the
  third than of the first, which the page says in its own first paragraph.
  It carries the four existing mechanisms, the three-way conflation, what is
  measured today, and the three questions with what would test each.
- The recoverability criterion from `3nfv` is carried as a **hypothesis with
  its counter-evidence stated**: it holds on two gateways, which is a worked
  example and not evidence, and it says nothing about a wrong branch that is
  recoverable but expensive, or recoverable only by somebody who will not be
  looking. The test proposed is the `relaxable="false"` five — classified by a
  different route — and whether recoverability predicts them.
- A reader-facing block on the agentic-harness page, pointing at the skill
  rather than restating it.
- Found in passing: `bun run site:links` from the repository root exits 0 while
  resolving nothing, because the root carries no `harness.json` after the #223
  split. Bean `ipth`.

## What is NOT done, and is the actual research

No experiment has been run. Question 3 is **not yet answerable** — the
instrument does not exist, and the skill says what would be needed: the same
sub-process run by different models with everything else held, an overlay that
something deliberately varies, and a comparison that is not the agent's own
report.

## Done when

- [x] the spectrum is named, in the harness's own docs
- [x] the three-way conflation stated, so the questions can be well-formed
- [x] every claim marked measured / decided / hypothesis
- [x] the research questions recorded as OPEN, with what would test each
- [x] 43 gates pass
