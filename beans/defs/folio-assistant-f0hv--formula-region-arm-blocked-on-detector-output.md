---
# folio-assistant-f0hv
$schema: bean/1.0.0
title: 'INGEST: formula-region arm (ScanSSD-style), blocked on recorded detector output'
status: todo
type: task
priority: low
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T12:45:00Z
parent: folio-assistant-slw1
---

Bean for cat-harness-tools#131. There is no code yet. The ScanSSD weights download from drive.google.com and huggingface.co, and both are refused (403) in cloud sessions, so the acceptance benchmark cannot run here. An arm that always answers "undetermined" would ship untested (the 5rfy defect).

## Blocked until
The owner or agy runs ScanSSD on a machine with ordinary internet, over a page set with known formula boxes (TFD-ICDAR2019v2, or hand-boxed qou scans), and commits the detector output together with the truth boxes.

## Done when
- [ ] the arm reads the recorded detector output and emits an advisory sidecar. It never transcribes and never gates promotion.
- [ ] its benchmark scores against the committed truth boxes.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)
