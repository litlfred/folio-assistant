---
# folio-assistant-vljz
title: 'QA: test data for SME review of decision support and indicator definitions'
status: todo
type: feature
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-09-19T08:55:36Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "QA review as
part of test process recorded in KG. also test data used for SME review of
decision support, and indicator defintion."

## What is distinct about this from ordinary QA

Ordinary QA here is mechanical or agentic: a criterion runs over a block and
writes a verdict. This is neither. A subject-matter expert reads a **worked
case** — a patient record, an encounter, a period of aggregated data — and says
whether the decision-support logic or the indicator definition gave the right
answer.

The artefact is therefore a pair: the data, and the SME's judgement about what
the system did with it. Neither is useful alone. A judgement with no data is an
opinion; data with no judgement is a fixture.

## Two subjects, and they are not the same test

- **Decision support** — given this patient state, did the logic recommend what
  the guideline says it should? The unit is a case.
- **Indicator definition** — given this population, does the indicator compute
  the number the definition intends? The unit is a cohort plus an expected
  value.

They need different data shapes and probably different review processes. Do not
collapse them because both say "the SME checks the number".

## Why it lands in the KG and benchmarking does not

An SME's verdict is an assertion about **the folio's content** — this
recommendation, this indicator. That is graph content by the provenance rule.
A benchmark number is an assertion about a model, and is not. The sibling beans
state both halves; the contrast is the point.

## Done when

- [ ] the case/verdict pair has a declared schema and a `$schema` tag
- [ ] the SME's identity and the date are recorded, because an audited review
      without an attributable reviewer is not audited
- [ ] the review is a BPMN process with the SME in a lane, and that lane's role
      is `judgementOnly` — no procedure yields the answer, which is the whole
      reason a person is in it

## Depends on

`TEST DATA: fixed and generated data sets` — these cases are the paradigm
**fixed** set, and their value comes from being unchanged after review.
