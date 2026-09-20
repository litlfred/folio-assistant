---
# folio-assistant-flh4
title: 'STATE PAGES: a graph whose declaration names a visualiser is reported as having none — the missing third state'
status: in-progress
type: task
parent: folio-assistant-yj32
created_at: 2026-09-20T21:26:38Z
updated_at: 2026-09-20T21:26:38Z
---

`cat-harness/docs/uploads/index.html` says "This graph is declared and nothing publishes a projection for it yet", while `harness.json` AND `cat-harness/harness.json` both give it a `coverage.visualiser`, that page exists, and it renders live per-instance queue counts (4/4/0, 28/2/26, 1/1/0). The page contradicts the repository's own declaration.

Cause: `projectionFor(id)` in `state-visualizer.ts` asks the disk for `assets/<id>/index.json` only. `uploads` publishes its queue block inside `assets/library/index.json`, so "no projection AT MY PATH" was collapsed into "nothing renders this". Two different facts.

Measured 2026-09-20 across both declarations: `uploads` is the ONLY graph with this defect. `qa`, `health` and `issue-marks` carry no `coverage.visualiser`, so their pages are honest; `beans` and `todos` are live.

## Done when
- [x] A graph whose declared `coverage.visualiser` resolves on disk links to it instead of claiming nothing renders it
- [x] A declared visualiser that does NOT resolve is reported as a defect, never rendered as either state
- [x] Falsified both ways in tests, and qa/health/issue-marks still say what they say now
