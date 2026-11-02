---
$schema: folio-fsh-guts/v1
title: "Four qou-shaped workflows, retired from folio-assistant: they build material only qou holds"
kind: retired-workflow
movedOn: 2026-11-02
movedFrom: ".github/workflows/{snappea_wasm,hecke-engine-wasm,witness-refresh,publish}.yml in litlfred/folio-assistant"
issue: 2909
summary: >-
  snappea_wasm, hecke-engine-wasm, witness-refresh and publish.yml named
  folio-assistant/computations and folio-assistant/snappea-wasm, paths of the
  old monorepo checkout that separation:cutover:check flags. All four ran only
  by hand. Retired on the owner's choice Q-SEP-5 A (2026-11-02 10:05Z); kept
  verbatim beside this note.
---

# Four qou-shaped workflows retired from folio-assistant (2026-11-02)

Copied verbatim from folio-assistant main at `41bbb14ed0` and removed from
`.github/workflows/` there, so `separation:cutover:check` (monorepo-paths)
passes. Part of fa#2894 Phase 2c (GOAL 1 separation), PR fa#2909.

| file | why it cannot run in folio-assistant |
|---|---|
| `snappea_wasm.yml` | builds `folio-assistant/snappea-wasm`, absent since the split |
| `hecke-engine-wasm.yml` | builds in `folio-assistant/computations`; that code lives in litlfred/qou |
| `witness-refresh.yml` | regenerates witnesses in `folio-assistant/computations` (qou) |
| `publish.yml` | the folio PDF/HTML pipeline; its witness steps and mount fallback name the old submodule layout |

All four were `workflow_dispatch` only (publish.yml also `workflow_call`).
qou's `build.yml` calls `publish.yml` at a pinned sha, which still resolves
after this removal; a future qou build belongs in qou (bean qou-pwp9).
Same treatment as `witness-pipeline.yml` (bean 52dz: dead workflows go here, never `rm`).
