---
# folio-assistant-amom
title: 'MODE: test/swarm — a stack of models over shared or independent work queues'
status: todo
type: feature
priority: normal
created_at: 2026-09-19T08:55:37Z
updated_at: 2026-09-19T08:55:37Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "test/swarm
mode: may have a stack of models, to queue work on (a cross-model swarm mode).
shared or indepedent work queues."

## What exists

`skills/folio-core/swarm-management.md` and `docs/swarm-management.md`. The rule
recorded in `AGENTS.md` is that a swarm is **asked for every time, per swarm,
with agent count, model level and rough cost**. That rule survives this bean
unchanged — nothing here makes a swarm automatic.

`beans/` is already the shared work queue: claim-before-you-work, never resolve
a sibling's bean, never delete one. So the "shared queue" half may already be
built, and the bean should start by checking that rather than designing a second
queue. A second work store is the drift this repository keeps paying for.

## What is genuinely new: cross-model

Today a swarm is agents of one model class. #363 asks for **a stack of models**
with work queued across them. Three things that changes:

1. **Attribution.** A result must record which model produced it, or a
   benchmarking run cannot compare them — which is the sibling bean's whole
   purpose.
2. **Shared vs independent queues is a real fork, not a setting.** Shared means
   any model may take any item, and the comparison is over outcomes on different
   items — which is not a comparison. Independent means each model gets the same
   bank, and the results are comparable. For benchmarking, independent is
   mandatory; for throughput, shared is the point. **They are different modes,
   and conflating them produces a benchmark that means nothing.**
3. **Claiming.** The bean claim protocol assumes one agent per item. Independent
   queues means N agents legitimately working the same item, which the current
   protocol reads as a collision.

## Done when

- [ ] shared and independent queues are distinct, named, and a run declares which
- [ ] every result records the model that produced it
- [ ] the claim protocol handles N-agents-one-item, or independent queues are
      kept outside `beans/` with a written reason

## Open question for the BA

Whether an independent-queue benchmarking run should touch `beans/` at all. It
is not work-plan work — it is a test harness execution — and `AGENTS.md` already
says never to `beans create` bulk machine-generated queues. That rule may
already settle it.
