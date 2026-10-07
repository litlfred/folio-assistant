---
# folio-assistant-oz9e
title: 'BENCHMARK: outcome evaluation of harness runs across models (close B8 — accuracy, not only structure)'
status: todo
type: feature
priority: normal
created_at: 2026-09-29T21:30:50Z
updated_at: 2026-09-29T21:32:03Z
parent: folio-assistant-5a3l
---

From the ARG-Designer mapping (arXiv 2507.18224), row B8: *they measure
accuracy on benchmarks; we check structure.* The owner, 2026-09-29: that gap is
**intended** to be closed, as part of the tool-harness / multi-model
benchmarking work under this epic — not left as a permanent difference.

## What is missing today

Every check cat-harness runs is **structural**: a lane binds a role, a step is
enabled, an actor is authorised, a sidecar is current. None says whether a run
through a process produced a *better outcome* than a run without it, or than
the same process on another model. ARG-Designer reports accuracy and token
cost on six public benchmarks (MMLU, GSM8K, MultiArith, SVAMP, AQuA,
HumanEval); we have no number comparable to any of theirs.

## What this bean is for

An **outcome evaluation** of harness runs:

- the same bank of tasks run **with** the harness (process + roles + skills)
  and **without** it, per model — so the harness itself is the variable;
- the same bank across a **stack of models** (independent queues, per `amom`,
  because shared queues do not give a comparison);
- outcome (task success / accuracy) **and** cost (tokens, wall-clock) recorded
  per model and configuration, with attribution.

## Constraints already decided elsewhere

- Results are a **report**, not KG content (`wp49`): a benchmark number is a
  fact about a model under one configuration, not about the folio.
- A swarm is asked for every time, with agent count, model level and cost
  (`swarm-management`).
- Which benchmarks — public ones for comparability with ARG-Designer, a bank of
  harness-native tasks, or both — is a CRDM requirements question, not decided
  here.

## Done when

- [ ] the task bank(s) are chosen through CRDM and recorded
- [ ] a run records outcome and cost per model and per with/without-harness configuration
- [ ] the report exists per `wp49` and states its setup well enough to compare with ARG-Designer's
- [ ] the ARG-Designer mapping issue's B8 row is updated to point at the result


Source: ARG-Designer mapping, [issue #1491](https://github.com/litlfred/folio-assistant/issues/1491) row B8. Related beans: `wp49` (report, not KG content), `amom` (independent queues across a model stack).
