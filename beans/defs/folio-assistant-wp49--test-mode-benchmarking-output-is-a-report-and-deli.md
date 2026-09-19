---
# folio-assistant-wp49
title: 'TEST MODE: benchmarking output is a report, and deliberately not KG content'
status: todo
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "test mode:
results are compiled for things like benchmarking across a model, running a bank
of test scenarios for a single model (verifiablility). restuls not intended to
be stored in the KG, more to synthesizsd in a benchmarking report."

## The rule, and why it is not obvious

Every other verdict this project produces goes **into** the graph. QA sidecars,
witnesses, `kg-qa` results — `harness.json` declares `test/results/` as the `qa`
graph precisely so they are addressable. So "benchmark results do not go in the
KG" is a deliberate exception and needs its reason written down, or the next
agent will helpfully declare a graph for them.

The reason: a KG node is an assertion about the subject. A benchmark number is
an assertion about **the model that produced it under one configuration at one
time** — it is not a fact about the folio, and admitting it would make the
graph's contents depend on which model happened to run. Two instances of the
same folio would then hold different graphs.

The synthesis — the report — is a different artefact with a different audience
and a different lifetime.

## Consequences to design for

- a benchmarking run must be able to write nothing into the declared graphs, and
  that should be **enforced**, not merely intended
- the report needs somewhere to live that is not a graph directory
- "according to use needs as descibed by CRDM process" (#363): the report's
  contents are a requirements question, so its shape is decided in CRDM, not here

## Done when

- [ ] the exception and its reason are stated in a skill, not only in this bean
- [ ] a benchmark run writing into a declared graph is caught by a check
- [ ] the report's location is declared and is not a `graphs:` entry

## Contrast with

`QA REVIEW MODE: translation QA joins the audited review record under
test/results` — the sibling bean, and the opposite disposition. QA review output
IS graph content because it is an assertion about the folio. Keeping the two
beans adjacent is deliberate: the distinction is the interesting part.
