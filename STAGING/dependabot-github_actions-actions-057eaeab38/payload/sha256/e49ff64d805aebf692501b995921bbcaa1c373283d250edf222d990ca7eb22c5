---
# folio-assistant-502c
$schema: bean/1.0.0
title: 'EXPERIMENT: forced along a BPMN vs managing it — do outcomes change, at what compute?'
status: in-progress
type: task
created_at: 2026-09-19T17:04:01Z
updated_at: 2026-10-24T14:20:00+02:00
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

- [x] both arms run the same diagram on the same task bank, recorded as
      `folio-test-run/v1` with the process hashes differing and the data
      hashes identical
- [x] time and token cost are recorded per arm, not just the outcome
- [x] the write-up states what is confounded, and does not present a
      harness comparison as a model comparison

## Summary of Changes (2026-10-24)

Opened [`litlfred/cat-harness-tools#739`](https://github.com/litlfred/cat-harness-tools/pull/739) (`06a3c128`) and [`litlfred/cat-harness#564`](https://github.com/litlfred/cat-harness/pull/564) (`7b0566c7`):

1. **Two-arm runner & `folio-test-run/v1` emission (`cat-harness-tools#739`, `06a3c128`):**
   - `src/workflow/arm-forced.ts` (`forced` arm) and `src/workflow/arm-self-managed.ts` (`self-managed` arm) run `processes/sdlc/test-plan-execution.bpmn` (+ called subprocess `processes/sdlc/qa-report-signing.bpmn`) over the independent 10-case task bank `scripts/eval/bpmn-forced-vs-managed-bank.json` (`bpmn-forced-vs-managed-v1`: 5 disciplined DMN-branch cases + 5 temptation cases).
   - `scripts/eval-bpmn-forced-vs-managed.ts` (`bun run cat eval:bpmn-forced-vs-managed`) emits `folio-test-run/v1` records with `data.hash = 075b8147319d` (identical across arms), `forcedRun.process.hash = 8c6a698f692c` vs `selfManagedRun.process.hash = 0ac3e9ced2af` (`hashesReproduce = { data: true, process: false, both: false }`), guarded by `assertBenchmarkOutputPath` to `build/benchmarks/bpmn-forced-vs-managed/` (verified by `scripts/tests/bpmn-forced-vs-managed.test.ts`, 4 tests / 178 assertions).
2. **Outcome, time & token cost per arm:**
   - **Arm 1 (`forced`):** `10/10` (`100.0%`) exact path match, `10/10` (`100.0%`) terminal match, `0` skipped steps, `0` invalid DMN assertions, `0` subprocess bypasses, `0` context overlay leaks; `133` total turns (`11` engine refusal retries on the 5 temptation cases), `32,097` prompt tokens (`241` mean prompt tokens/turn), `1,334` completion tokens, `33,431` total tokens, `4.15 ms` wall time.
   - **Arm 2 (`self-managed`):** `6/10` (`60.0%`) exact path match (`5/5` disciplined, `1/5` temptation), `9/10` (`90.0%`) terminal match, `10` skipped mandatory steps, `3` invalid DMN gateway assertions, `1` subprocess bypass, `2` context overlay leaks; `132` total turns (`0` refusal retries), `801,686` prompt tokens (`6,073` mean prompt tokens/turn), `4,228` completion tokens, `805,914` total tokens, `4.83 ms` wall time.
3. **Write-up & confound analysis (`cat-harness#564`, `7b0566c7`):**
   - `docs/research-and-analysis/bpmn-forced-vs-managed.md` (and `skills/process/workflow/deterministic-and-agentic.md`) explicitly frames the experiment as a harness comparison on one diagram pair and task bank rather than a model-vs-model comparison, and documents the three structural confounds (control-flow enforcement co-varying with per-turn prompt context length `241` vs `6,073` tokens/turn; refusal-retry turn overhead depending on shortcut rate; and benchmark isolation outside the KG under `assertBenchmarkOutputPath`).
