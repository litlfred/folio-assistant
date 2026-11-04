---
# folio-assistant-8bm7
$schema: bean/1.0.0
title: 'Phase 1: fhir-harness main finishes a check run and turns green (closes fhir-harness#269, #271)'
status: completed
type: task
priority: high
created_at: 2026-11-02T06:50:00Z
updated_at: 2026-11-02T11:02:00Z
parent: folio-assistant-4j43
tags:
    - harness-drain-2026-11-02
---

No Harness PR checks run on fhir-harness main has finished since 2026-11-01 21:34Z: every later run ends cancelled. Findings so far (06:50Z):
- Main's gates and tests PASS in those runs (run 41395643928: 4 shards and "No new failures" green). The run ends cancelled because the job "Record main's page-build scripts (bean fwtz)" runs 20+ min and is cancelled with "Canceling since a higher priority waiting request for layer-pr-checks-litlfred/fhir-harness-refs/heads/main exists" when the next push lands.
- The next push's run has its Prepare jobs cancelled within 1 s (runs 41398804987, 41381199912), so it never judges either.
- cat-harness-tools .github/scripts/layer-main-qa/report.py skips a cancelled gate run even when VERDICT is green, so fhir-harness#269 is never closed.
Fix in cat-harness-tools (layer-pr-checks.yml concurrency / record job, report.py), then one green main run. Also fhir-harness#271 with option A (optional peer dependency), tested.

_2026-11-02T06:50:00Z_ — Filed by the harness drain thread (owner card Q-HDR-1 A, 2026-11-02 06:44Z), session https://claude.ai/code/session_01Qmmkt5upL17RB2jgQPi8Mx

## Done (2026-11-02 11:00Z)
fhir-harness main green at 4dc8571 (run 41429364740, main-qa success); bot closed fhir-harness#269. Landed: cat-harness-tools#1384, fhir-harness#273 (via #274), fhir-harness#276.
