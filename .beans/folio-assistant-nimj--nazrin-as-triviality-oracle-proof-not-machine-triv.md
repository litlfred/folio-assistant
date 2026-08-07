---
# folio-assistant-nimj
title: Nazrin as triviality oracle (proof-not-machine-trivial)
status: in-progress
type: task
priority: normal
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-07T11:33:48Z
---


## Idea

Nazrin (arXiv 2602.18767) is a GNN over a minimal Lean expression graph
emitting *atomic* tactics; trains and runs on consumer hardware. As a prover
it will not beat the frontier LLM already in the loop.

Inverted, it is useful: **if a cheap CPU model closes the goal in <= N atomic
tactics from cold, the statement probably carries no content.** That is what
the whole vacuity family exists to catch — `proof-no-trivial-true`,
`proof-no-trivial-skeleton`, `proof-rater-novelty`, `proof-no-decide-masking`
— and five of six are `automated: false`, i.e. they burn agent turns.

New criterion `proof-not-machine-trivial`, emitting to `metrics`, severity
`warn`. Evaluate false-positive rate on the qou corpus BEFORE committing;
research-grade, and its whole value is in that rate.

## Status: scaffolded, NOT validated

Built the full path — cache format, checker, criterion, 7 tests — but the
oracle's false-positive rate is still **unmeasured**, which is the whole
question. Left `in-progress`, not `completed`: shipping the scaffold is
not the same as adopting the idea.

Landed:
- `content/pipeline/qa-checkers-triviality.ts` — reads
  `docs/audits/lean-triviality.json`, SHA-stamped like the other caches.
- `proof-not-machine-trivial` criterion, `minor` + warn-only, statement
  granularity, `n/a` when unmeasured or stale.
- 7 tests, including one asserting it can NEVER return `fail` regardless
  of input, and one that a stale measurement reports `n/a` rather than a
  confident wrong answer.

Inert by construction: no cache ⇒ `n/a`, and the note says 'not measured',
never 'nothing trivial'.

## Remaining (the actual bean)

- [ ] Obtain/run a Nazrin-class oracle (needs a Lean toolchain — this
      container has none).
- [ ] Emit `lean-triviality.json` over the qou corpus.
- [ ] Measure the false-positive rate: of blocks flagged at <= 3 atomic
      tactics, how many are substantive results?
- [ ] Tune `TRIVIAL_STEP_THRESHOLD` — currently 3, a guess.
- [ ] Only then decide whether the severity should rise above `minor`.
