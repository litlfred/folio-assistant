---
$schema: folio-fsh-guts/v1
title: "witness-pipeline.yml, retired: it could only run inside a folio checkout"
kind: retired-workflow
movedOn: 2026-10-20
movedFrom: ".github/workflows/witness-pipeline.yml in litlfred/folio-assistant"
summary: >-
  A workflow_dispatch-only pipeline that invoked python3
  folio-assistant/computations/<script>, scripts that exist only in a folio
  checkout such as qou, never on the platform. Zero runs, ever. Retired on the
  owner's choice of 2026-10-20 (bean folio-assistant-1l13); kept verbatim beside
  this note under workflows/.
---

# witness-pipeline.yml — retired

## What was retired

`.github/workflows/witness-pipeline.yml`, kept verbatim at
`retired/workflows/witness-pipeline.yml` on this branch.

## Why

- Measured 2026-10-05 (bean `1l13`): every step runs
  `python3 folio-assistant/computations/<script>`; on platform `main` there are
  0 files under that path, and both scripts it names live only in qou's
  `computations/`. Dispatched here it would fail at the first script.
- qou has an executable replacement for the refresh half: litlfred/qou#7514
  (`processes/content/witness-refresh.bpmn` and the `witness-refresh-plan` Tool).
- Owner, 2026-10-20, choosing among keep / move to folio_init templates / retire:
  **"Retire to fsh-guts"**.

## Left behind, on purpose

`.github/workflows/build-clarabel-mpfr.yml` existed to publish a prebuilt
binary for this pipeline's "Provision clarabel-MPFR binary" step. It stays —
its fate is its own decision, recorded on bean `1l13` — and its header now says
its consumer was retired. Comments in cat-harness-tools
(`trivial-skeleton-audit.ts`, `conditional-class-banner-audit.ts`,
`audit-empty-corpus.test.ts`) still name this workflow as a caller.
