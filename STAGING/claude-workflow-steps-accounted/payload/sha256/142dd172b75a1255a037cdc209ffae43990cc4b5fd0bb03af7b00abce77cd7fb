---
# folio-assistant-wp49
$schema: bean/1.0.0
title: 'TEST MODE: benchmarking output is a report, and deliberately not KG content'
status: completed
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-10-09T17:11:00Z
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

- [x] the exception and its reason are stated in a skill, not only in this bean
- [x] a benchmark run writing into a declared graph is caught by a check
- [x] the report's location is declared and is not a `graphs:` entry

## Contrast with

`QA REVIEW MODE: translation QA joins the audited review record under
test/results` — the sibling bean, and the opposite disposition. QA review output
IS graph content because it is an assertion about the folio. Keeping the two
beans adjacent is deliberate: the distinction is the interesting part.

## Closed 2026-10-09

- **Branch**: `claude/wp49-benchmark-report-mode`
- **Commit**: `4898da1d8c9383074b39b7dac497c80b0e124fe0`
- **Implementation & Evidence**:
  - **Skill documentation**: Added `skills/sdlc/sdlc-core/benchmarking-mode.md` stating the rationale for treating benchmark results as external synthesis reports rather than KG nodes, registered in `skills/sdlc/sdlc-core/package-manifest.json`.
  - **Report location**: Designated `build/benchmarks/` (default, gitignored) and `reports/` (synthesized CRDM reports) as destination paths, kept strictly outside declared `graphTypologies`.
  - **Path guards**: Created `scripts/benchmark-guard.ts` (TypeScript) and `scripts/_benchmark_guard.py` (Python) asserting that benchmark target paths resolve outside any declared graph directory in `cat-harness.json`.
  - **Runner defaults & guards**: Updated `scripts/toc-benchmark.py` and `scripts/page-label-benchmark.py` to default `--json` output to `build/benchmarks/*.json` and enforce `assert_not_declared_graph_path`.
  - **Test verification**:
    - `bun test scripts/tests/audit-output-paths.test.ts`: 19 passed, 0 failed, 113 expect() calls. Verified runners do not default into graph dirs, default to `build/benchmarks/`, and path guard rejects graph destinations (`beans/`, `todos/`, `test/results/`).
    - `bun test scripts/tests/skill-manifest-coverage.test.ts scripts/tests/skill-contracts.test.ts scripts/tests/skill-docs-links.test.ts scripts/tests/skill-governance.test.ts scripts/tests/skill-topics.test.ts`: 33 passed, 0 failed.
    - `bun run typecheck`: clean (exit 0).
