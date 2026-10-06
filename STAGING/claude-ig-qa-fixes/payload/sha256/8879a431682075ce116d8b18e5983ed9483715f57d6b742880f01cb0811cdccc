---
# folio-assistant-63wl
title: 'Placement PR3: BPMN and DMN move up to their owners; harness processes regroup by concern'
status: completed
type: task
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-02T16:25:17Z
parent: folio-assistant-iirv
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR3: 19 BPMN + 5 DMN move up (sci: `authoring-a-paper`, `atomic-mass-drift-check`, `lean-build-gate.dmn`; smart-base: `l2-dak-authoring`; fhir-harness: `l3-fhir-pipeline`, `ig-incremental-build`; core: `authoring-a-document`, `content-change-review` + `review-coverage-gate.dmn`, `editing-hci-validation`, `draft-to-publication` + `draft-qa-gate.dmn`, `content-lifecycle`, `evidence-retrieval`, `getting-started` + 2 DMN, the 3 `board-*`, the 4 `ingest-*` sequenced with PR6). 47 BPMN + 4 DMN regroup in the harness into `processes/{sdlc,process,kg,library,ui,content}/`. Travelling edits: `crdm-requirements-definition` `content-graph` → `data-modelling`; `review-narrative`'s `uses-editorial-review` task → core `content-change-review`; `review-task` drops `semantic-review-scoping`.

Waits on PR1 (`ybwt`, not yet on main).

## Done when
- [ ] `workflowFiles(checkout)` returns the same process and decision ids (only paths change); every `calledElement` resolves
- [ ] `residual.py`: 0 harness→higher `calledElement` edges except the 4 in `document-ingestion.bpmn` (PR6 removes)
- [ ] `workflow_start`/`workflow_next` on `crdm-requirements` walks the same steps
- [ ] `render:bpmn:check`, `check:workflow-refs`, `check:raci`, `kg:audit:check` green

_2026-10-02T14:14Z_ — Claimed by claude/placement-pr3-63wl (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH), assigned by the merge steward.

_2026-10-02T14:14Z_ — "Waits on PR1 (ybwt)" is satisfied: ybwt merged (#1758/#1760); its remaining box (91 harness-BPMN skill refs to moved skills) IS this PR's work (ybwt body, 2026-10-01 arc 7x5n S1).

## Summary of Changes

_2026-10-02_ — PR #1875 (issue #1874), branch claude/placement-pr3-63wl.

- Up: sci (authoring-a-paper, atomic-mass-drift-check, lean-build-gate.dmn), fhir-harness (l3-fhir-pipeline, ig-incremental-build), core content/ (authoring-a-document, content-change-review + review-coverage-gate.dmn, editing-hci-validation, draft-to-publication + draft-qa-gate.dmn, content-lifecycle, evidence-retrieval), core conduct/ (getting-started + folio-intent.dmn + pages-live-gate.dmn), core ui/ (3 board-*). l2-dak-authoring was already in smart-base. The 4 ingest-* stay in the harness (processes/library/) for PR6.
- Harness regrouped: 59 BPMN + 4 DMN into processes/{sdlc,process,kg,library,ui,content}/, declared by processes/processes.json; core declares conduct.
- Travelling edits done: content-graph -> data-modelling; Task_ReviewUses into core content-change-review; review-task drops semantic-review-scoping (binds content-review).
- Recursive diagram resolution (process-model, workflowDirs, kg-audit, kg-export, external-schemas, gen-upload-step-docs, kg-detangle); new workflowFile(root, name).
- Done-when evidence: 91 ids identical before/after (84 moved), all 60 calledElement resolve; 0 harness->higher calledElement edges; crdm-requirements walk identical (61 steps) except the two edited skill bindings; render:bpmn:check, check:workflow-refs, check:raci, kg:audit:check, kg:audit:all:check, kg:detangle:check green; CI green on 09a8ba7c2.
- Remaining upward BPMN skill refs from the harness, instance-strict: 29 x document-intake (document-ingestion + 4 ingest-*, PR6) and 3 x ig-ast-delta (ig-ast-delta-review, placement audit SPLIT, unplanned).
- Owner question open: commit 10dfb22c7 removes the orphaned processes.detangle.json (NEEDS OWNER CONFIRMATION).
