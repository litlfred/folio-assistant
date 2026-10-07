---
# folio-assistant-bkje
title: 'ACTOR FACTS: a declared actor fact with no consuming process'
status: todo
type: task
created_at: 2026-09-20T03:12:36Z
updated_at: 2026-09-20T03:12:36Z
parent: folio-assistant-ahvw
---


**The parent of three, from the owner 2026-09-20.** Full argument:
[`cat-harness/docs/proposals/actor-facts-and-their-processes.md`](../../cat-harness/docs/proposals/actor-facts-and-their-processes.md).

An actor fact that no process reads is the same defect as a skill bound to
no role — found four times here, fixed once, and the missing CONSUMER was
never added:

| when | where | what |
|---|---|---|
| 2026-09-18 | `capabilities[]` | probes + permissions + skills in one field. **Fixed** (`ind9`) by splitting it |
| 2026-09-18 | `requirements/*.json` | read as skills — "the same category error `actors/` and `capabilities/` had" (`m4zg`) |
| 2026-09-19 | skill front-matter `roles:` | four kinds, no reader (`qif9`) |
| 2026-09-20 | actor facts generally | correctly declared, still unconsumed |

`ind9` gave permissions a home. It did not give them a reader. **Splitting
a field ends an ambiguity; it does not create a consumer.**

## The rule proposed

> Every declared actor fact needs a process that reads it. Where the fact
> makes the machine route impossible, the process routes to a human lane.

## Children

- `folio-assistant-r0rq` — signing, two routes
- `folio-assistant-85e8` — degradation cannot fall back to an actor
- `folio-assistant-hb2o` — actor/role administration is undrawn

## Done when

- [ ] `actor-fact-has-consumer` exists as a `kg:audit` criterion, reporting
      before it gates, with a vacuity guard
- [ ] the count it reports is recorded, so later runs can be compared
