---
# folio-assistant-mlux
title: 'PROCESS BINDINGS: clear the 33 wrong-direction skill bindings check:process-bindings baselined'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T10:38:18Z
updated_at: 2026-10-03T15:01:36Z
parent: folio-assistant-vke6
---

Owner, 2026-10-03: a process may bind only skills (and through them Tools) from its own instance or one it needs — "general rule, not just fhir-harness". `check:process-bindings` (cat-harness/scripts/, PR #1968) found 33 unique wrong-direction bindings (35 refs) in 9 diagrams on 2026-10-03, all baselined in cat-harness/scripts/process-bindings.baseline.ts. Each fix is EITHER move the process up to the instance holding the skill, OR move the skill down if it is generic — an owner call per group.

Root cause the gate fixes: kg-audit's skill-ref-resolves resolves against knownSkills(root), which is CHECKOUT-scoped in this pre-split repo, so 'resolves' meant 'exists anywhere'.

## Done when

- [x] cat-harness ingestion processes (6 diagrams, 28 refs) → folio-assistant-core's document-intake. library-ingestion says 'Ingestion is a HARNESS capability, not core's', which argues for moving document-intake DOWN to cat-harness. Owner to confirm.
- [x] cat-harness/processes/content/ig-ast-delta-review.bpmn (3) → fhir-harness's ig-ast-delta: move the process up to fhir-harness (a generic IG process), or the skill down.
- [x] folio-assistant-core content-change-review.bpmn Task_DetectScope → folio-assistant-sci's semantic-review-scoping
- [x] folio-assistant-core draft-to-publication.bpmn Task_PublishRelease → fhir-harness's ig-publication
- [ ] fhir-harness l3-fhir-pipeline.bpmn Task_MapL2 → smart-base's l2-dak-authoring: cleared by veiu (#1964, the BPMN moves up to smart-base)
- [ ] kg-audit skill-ref-resolves gets an instance-scoped resolvable set, or explicitly defers to this gate (follow-up, ask the owner)
- [ ] BASELINE is [] and the gate passes
- [x] (minor) document-ingestion.bpmn Task_Citeable carries the same skill ref three times


## Owner rulings, 2026-10-03 (selected options, recorded verbatim; session https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7)

- **A. "Move skill down".** `folio-assistant-core/skills/library/ingestion/document-intake.md` moves into cat-harness (its library skills area), matching library-ingestion's "Ingestion is a HARNESS capability, not core's". This clears the six cat-harness ingestion processes (28 refs).
- **B. "Move process up".** `cat-harness/processes/content/ig-ast-delta-review.bpmn` moves into `fhir-harness/processes/content/`, beside `ig-ast-delta`. It must stay WHO-free.
- **C. "Drop from core; sci adds it".** In `folio-assistant-core/processes/content/content-change-review.bpmn`, Task_DetectScope stops binding `semantic-review-scoping`; folio-assistant-sci binds it in its own overlay for papers, following the existing overlay pattern.
- **D. "Drop the ig-publication ref".** In `folio-assistant-core/processes/content/draft-to-publication.bpmn`, Task_PublishRelease keeps `content-publish` and `render-kg-to-cdn` and drops `ig-publication`.
- **Also (minor):** `document-ingestion.bpmn` Task_Citeable carries the same skill ref three times; make it one.
- **Not this bean's:** fhir-harness `l3-fhir-pipeline` is bean veiu's (#1964).

Worked by session https://claude.ai/code/session_01Vmo3FY8yc8ouQ8qiWsEAfw on branch `claude/mlux-process-bindings`.

## Progress (PR #2010, issue #2009)

- A: `document-intake` now lives in `cat-harness/skills/library/library-core/`; core's single-skill `ingestion` package is gone. The placement-PR1 test no longer pins it to core. The core `roles.json` extension edges stay where they are, since they point down.
- B: `ig-ast-delta-review.bpmn` is now in `fhir-harness/processes/content/`. #1968's `check-fhir-harness-exclusions` reports no hit above its baseline.
- C: Task_DetectScope declares `<cat-harness.processes:no-skill reason>`, which names the overlay. That overlay already existed: `folio-assistant-sci/scenarios/roles.json` extends `authoring-agent`, the task's lane role, with `semantic-review-scoping`. There is no per-activity BPMN binding overlay in this repo, so the role extension IS the pattern, and nothing new was invented. `content-graph` was considered and rejected as a binding: it reorganises content rather than detecting a change's scope.
- D and the minor fix are done.
- Measured with #1968's checker in a scratch copy (not committed): `--shrink` drops 32 entries, and only veiu's `l3-fhir-pipeline → l2-dak-authoring` remains.
- Still open: the kg-audit `skill-ref-resolves` follow-up (an owner question), and the `--shrink` commit once #1968 merges.
