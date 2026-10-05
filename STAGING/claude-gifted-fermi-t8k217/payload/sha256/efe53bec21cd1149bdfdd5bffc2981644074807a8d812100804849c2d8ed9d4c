---
# folio-assistant-502c
title: 'EXPERIMENT: forced along a BPMN vs managing it — do outcomes change, at what compute?'
status: todo
type: task
created_at: 2026-09-19T17:04:01Z
updated_at: 2026-09-19T17:04:01Z
parent: folio-assistant-ahvw
---


**Uncaptured owner requirement**, same comment as `folio-assistant-cy4p`
and `folio-assistant-3q47` —
[#363](https://github.com/litlfred/folio-assistant/issues/363#issuecomment-5740727385),
09:20, not beaned until 17:0x.

> comparision scenarios: give LLM BPMN and force them along it, givem LLM
> BPMN and let them manage workflow. do behaviour outcomes change? how
> much time/compute was needed?

## Two arms, one diagram

- **forced** — the engine drives. The agent is handed one enabled step at
  a time and cannot skip, per `folio-assistant-3q47`.
- **self-managed** — the agent is handed the whole diagram and decides its
  own order.

Two dependent variables, and the owner named both: **behaviour outcomes**
(does the work come out different) and **time/compute** (what did the
determinism cost).

## The measurement machinery now exists

`folio-test-run/v1` (`schemas/test-run.ts`, bean `folio-assistant-zz0a`,
shipped 2026-09-19) is exactly the shape this needs: a **data** hash and a
**process** hash, disjoint by construction, so a result says what was run
and what ran it. Here the arms differ ONLY in the process half — same
diagram, same task, same corpus — which is precisely what the two-hash
split makes visible and a single hash would blur.

## The trap, and it is the whole experiment

**This compares a model against a harness, not a model against a model.**
A result saying "forced did better" is a claim about THIS engine, THIS
diagram and THIS task. `deployment-topologies.md` §2 already rules that a
benchmark number is an assertion about a model rather than about the
folio and **does not enter the KG**; the same applies here, and more
strongly, because the confound is the harness itself.

Related: `folio-assistant-amom` (shared vs independent work queues — an
independent bank is required for anything comparative) and
`folio-assistant-wp49` (the benchmark report).

## Done when

- [ ] both arms run the same diagram on the same task bank, recorded as
      `folio-test-run/v1` with the process hashes differing and the data
      hashes identical
- [ ] time and token cost are recorded per arm, not just the outcome
- [ ] the write-up states what is confounded, and does not present a
      harness comparison as a model comparison
