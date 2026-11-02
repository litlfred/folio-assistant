---
$schema: folio-fsh-guts/v1
title: "Three qou-shaped workflows, retired from folio-assistant: they build material only qou holds"
kind: retired-workflow
movedOn: 2026-11-02
movedFrom: ".github/workflows/{snappea_wasm,hecke-engine-wasm,witness-refresh}.yml in litlfred/folio-assistant"
issue: 2909
summary: >-
  snappea_wasm, hecke-engine-wasm and witness-refresh named
  folio-assistant/computations and folio-assistant/snappea-wasm, paths of the
  old monorepo checkout that separation:cutover:check flags. All three ran only
  by hand. Retired on the owner's choice Q-SEP-5 A (2026-11-02 10:05Z); kept
  verbatim beside this note. publish.yml was archived too at first, then kept
  in fa: cat-harness-tools tests treat it as the platform's reusable folio
  pipeline.
---

# Three qou-shaped workflows retired from folio-assistant (2026-11-02)

Copied verbatim from folio-assistant main at `41bbb14ed0` and removed from
`.github/workflows/` there, so `separation:cutover:check` (monorepo-paths)
passes. Part of fa#2894 Phase 2c (GOAL 1 separation), PR fa#2909.

| file | why it cannot run in folio-assistant |
|---|---|
| `snappea_wasm.yml` | builds `folio-assistant/snappea-wasm`, absent since the split |
| `hecke-engine-wasm.yml` | builds in `folio-assistant/computations`; that code lives in litlfred/qou |
| `witness-refresh.yml` | regenerates witnesses in `folio-assistant/computations` (qou) |

All three were `workflow_dispatch` only. `publish.yml` stays in
folio-assistant: qou's `build.yml` calls it at a pinned sha, and
cat-harness-tools tests treat it as the platform's reusable folio pipeline.
Same treatment as `witness-pipeline.yml` (bean 52dz: dead workflows go here, never `rm`).
