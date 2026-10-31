---
# folio-assistant-f0hv
$schema: bean/1.0.0
title: 'INGEST: formula-region arm (ScanSSD-style), blocked on recorded detector output'
status: in-progress
type: task
priority: low
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-31T02:02:00Z
parent: folio-assistant-slw1
---

Bean for cat-harness-tools#131. There is no code yet. The ScanSSD weights download from drive.google.com and huggingface.co, and both are refused (403) in cloud sessions, so the acceptance benchmark cannot run here. An arm that always answers "undetermined" would ship untested (the 5rfy defect).

## Blocked until
The owner or agy runs ScanSSD on a machine with ordinary internet, over a page set with known formula boxes (TFD-ICDAR2019v2, or hand-boxed qou scans), and commits the detector output together with the truth boxes.

## Done when
- [ ] the arm reads the recorded detector output and emits an advisory sidecar. It never transcribes and never gates promotion.
- [ ] its benchmark scores against the committed truth boxes.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

_2026-10-30T19:45Z (thread "Drain ingest beans", https://claude.ai/code/session_01Qmmkt7JwQ9cqR2roBLdqKQ)_. Re-probed: drive.google.com and huggingface.co still refused here. Handed to agy with a precise output format: project files `ingest-drain-2026-10-30/agy-prompts.md` §3 (`test/fixtures/formula-regions/<set>/{detections,truth}.json` on cat-harness-tools). A cloud thread writes the arm once that PR lands.

_2026-10-31T02:02:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
