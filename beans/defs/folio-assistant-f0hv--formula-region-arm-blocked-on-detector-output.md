---
# folio-assistant-f0hv
$schema: bean/1.0.0
title: 'INGEST: formula-region arm (ScanSSD-style), blocked on recorded detector output'
status: completed
type: task
priority: low
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-31T02:38:34Z
parent: folio-assistant-slw1
---

Bean for cat-harness-tools#131. There is no code yet. The ScanSSD weights download from drive.google.com and huggingface.co, and both are refused (403) in cloud sessions, so the acceptance benchmark cannot run here. An arm that always answers "undetermined" would ship untested (the 5rfy defect).

## Blocked until
The owner or agy runs ScanSSD on a machine with ordinary internet, over a page set with known formula boxes (TFD-ICDAR2019v2, or hand-boxed qou scans), and commits the detector output together with the truth boxes.

## Done when
- [x] the arm reads the recorded detector output and emits an advisory sidecar. It never transcribes and never gates promotion.
- [x] its benchmark scores against the committed truth boxes.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

_2026-10-30T19:45Z (thread "Drain ingest beans", https://claude.ai/code/session_01Qmmkt7JwQ9cqR2roBLdqKQ)_. Re-probed: drive.google.com and huggingface.co still refused here. Handed to agy with a precise output format: project files `ingest-drain-2026-10-30/agy-prompts.md` §3 (`test/fixtures/formula-regions/<set>/{detections,truth}.json` on cat-harness-tools). A cloud thread writes the arm once that PR lands.

_2026-10-31T02:02:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).


## Summary of Changes

- **Recorded ScanSSD-XYc detector fixture (`test/fixtures/formula-regions/tfd-icdar2019v2-emden76/{detections,truth}.json`)**:
  - Retrieved DPRL's pretrained `ScanSSD-XYc` weights (`ssd512GTDB_256_epoch15.pth`, SHA-256 `2833e2e6417ce202e6e36ec06b01b25270ec2b6270c76869dae78b2c2cf4d937`) from RIT's MathSeer repository (`https://www.cs.rit.edu/~dprl/mathseer-pipeline/ssd512GTDB_256_epoch15.pth`, referenced by `course-correction/scanssd`) and ran inference (`cfg=math_gtdb_512, window=512, stride=0.75, conf_threshold=0.5, post_process=true`) at 256 DPI over all 10 pages of `TFD-ICDAR2019v2` test document `Emden76.pdf` (SHA-256 `911d2ff4a0a65a8d727c8db55431c5b75f5d9e5e72a2e051893505c8ac4051de`, 589 ground-truth formula boxes).
- **Advisory formula-region arm (`scripts/pdf-formula-regions.py`)**:
  - Reads recorded detector output (`--detections` or `<entry>/formula-detections.json`) and emits `<entry>/formula-regions.json` (`$schema: "folio-formula-regions/v1"`) with per-page formula bounding boxes in visible-frame PDF user-space points (`[x0, y0, x1, y1]`, 72 DPI, origin top-left, rotation applied), matching `vector-labels.json`.
  - Advisory only: never transcribes formulas, never touches `sections/`, and is listed in `ENTRY_SIDECARS` in `scripts/check-l1-complete.ts` without gating promotion.
  - Scans only by default: skips born-digital entries whose sections carry `text_source: latex` (`status: "skipped", pages: null`) unless `--force` is passed.
  - Explicit about absence: emits `status: "undetermined", pages: null` with `undetermined_reason` (never `pages: []`) when no detector output is available.
  - Benchmark `score` subcommand scores emitted or recorded detections against committed `truth.json` boxes (`IoU >= 0.5`: `gt=589, detected=447, tp=351, P=0.7852, R=0.5959, F1=0.6776, mean_matched_iou=0.8143`; `IoU >= 0.75`: `tp=278, P=0.6219, R=0.4720, F1=0.5367`), guarded by `_benchmark_guard.py`.
- **Tests & PR**:
  - Added 7 unit/benchmark tests in `scripts/tests/formula-regions.test.ts`.
  - Opened PR `litlfred/cat-harness-tools#1057` and commented on `litlfred/cat-harness-tools#131`.
