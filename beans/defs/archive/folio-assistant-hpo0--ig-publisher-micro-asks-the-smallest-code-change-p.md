---
# folio-assistant-hpo0
title: IG Publisher micro-asks — the smallest code change per ask, with the differential-build finding
status: completed
type: task
priority: high
tags:
    - smart-guidelines
    - ig-publisher
created_at: 2026-09-16T17:16:03Z
updated_at: 2026-09-16T17:16:03Z
---

## Brief

**What, and why.** The author wants the SMALLEST upstream asks: the AST, render-only and
validator-as-a-service are accepted in principle; the differential-build ask needed a
code investigation to become microscopic. For each ask: one sentence why, three
sentences of precise code change with file and line.

**What I already know (source, 2026-09-16).** temp/ is cleared only by
`clearTempFolder()` in the three complete-build branches of `checkDependencies()`
(Publisher.java:891, 933, 937) and in template dev mode (PublisherIGLoader.java:899); a
normal build never flushes it. The tracker lives in `pf.vsCache/.build-tracker.ini`
(Publisher.java:378) — the terminology-cache directory a CI restores anyway. Validation,
narrative and per-file generation loop over `changeList`; every aggregate loops over
`fileList`. Unchanged files' errors are cleared at load and never restored, so a
differential build's qa.html undercounts. The validator HTTP service already serves
/validateResource, /snapshot, /narrative, /loadIG, /convert and more; it holds one
engine; there is no status endpoint listing what is loaded.

**Plan and gate.** Rewrite §8.2 of the proposal as four micro-asks with file:line, and
record the finding that no temp flag is needed. Gate: docs checks. Falsifier: a claimed
location that does not match the source is removed, not softened.

**Not doing.** No new BPMN, no code.

## Summary of Changes

- `docs/proposals/ig-incremental-build.md` §8.4: the smallest code change per ask, with
  file and line — A the AST (extend `recordOutcome()`'s per-file report; call
  `loadDependencyList` in every mode; record `fragmentUses` and a `toolchain` object);
  B differential builds (persist each validated file's messages under `temp/_qa/`, reload
  them for skipped files in the differential branch of `checkDependencies()`, report
  `build.mode` in `qa-time-report.json`); C render-only (`-no-jekyll` → early return in
  `runTool()` beside the Simplifier path; skip HTML inspection as generation-off does);
  D validator service (a `/status` endpoint; fix the `server` help text; document the
  warm start). §8.5: the investigation — no temp flag is needed, `temp/` is flushed only
  on complete builds; the tracker lives in the restorable terminology-cache directory;
  aggregates are regenerated in full; only the QA aggregate undercounts. §8.2 B rows and
  the overview's R11 updated to match.
- Grounded in: Publisher.java 378, 448–452, 880–945, 948, ≈698–708, ≈1460;
  PublisherBase.java 618, 1579; PublisherProcessor.java 501, 1224; PublisherGenerator.java
  270–309, 557, 2503, ≈3921–3929, 4452, 4469; PublisherIGLoader.java 899, 973,
  4239/4374/4486; FetchedFile.java 322; FhirValidatorHttpService.java 54–69;
  LoadIGHTTPHandler.java 33; ContextUtilities.java 263.
