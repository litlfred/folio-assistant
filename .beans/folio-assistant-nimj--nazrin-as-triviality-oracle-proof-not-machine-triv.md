---
# folio-assistant-nimj
title: Nazrin as triviality oracle (proof-not-machine-trivial)
status: todo
type: task
created_at: 2026-08-07T09:13:35Z
updated_at: 2026-08-07T09:13:35Z
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
