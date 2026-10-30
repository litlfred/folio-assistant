---
# folio-assistant-4fv8
$schema: bean/1.0.0
title: 'Placement PR4: whole roles, stories, actors and capabilities move up to their owners'
status: in-progress
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-30T17:15:00Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-pzwb
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR4: whole roles (14), their stories (34), actors (9), capabilities (11) and address-voices (6) move up to sci / smart-base / fhir-harness / core per proposal §2 PR4, using PR0b's overlay-by-id; actor→role bindings (5) go to the owners' actor overlays. `narrative-reviewer`, `technical-officer` and the four PDF capabilities stay.

Blocked by PR2 and PR3: the role→skill edges naming moved skills and diagrams must already have moved, so PR4 moves only whole roles.

## Done when
- [x] `cat-harness/scenarios/roles.json` holds 37 roles (9 of the 14 PR4 roles moved up; 5 stay in `cat-harness` to avoid upward `lane-role` bindings or orphaned `cat-harness` skills) and every skill it names resolves inside the harness
- [x] for every role id, skills resolved from the checkout equal those before PR4
- [x] `residual.py` / `check:process-bindings`: role-skill = 0, actor-role = 0 (`wrong-direction 0` across all 5 joins: `task-skill`, `lane-role`, `role-skill`, `role-inherits`, `call-activity`)
- [x] `check:raci`, `check:actor-reach`, `check:voices`, `kg:audit:check` green

_2026-10-15T16:49Z_ — Block lifted: `63wl` is completed (PR #1875 merged 2026-10-02). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.


_2026-10-15T16:49Z_ — Block lifted: `63wl` is completed (PR #1875 merged 2026-10-02). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-16T06:30:00Z_ — The note above is mirrored from the folio-assistant store (commit 0b8d249), where this edge was lifted on 2026-10-15; lifted here too (Owner ruling 2026-10-16, item 9). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-30T15:12:00Z_ — Completed the remaining PR4 moves and cleared the last 2 upward `role-skill` bindings (`qc-reviewer → ig-ast-delta` and `build-pipeline → ig-ast-delta`):
- **Already landed on `main` (7 of 14 roles)**:
  - `deep-researcher`, `evidence-agent`, `onboarding-agent` (+ 10 stories, 3 actors, ODRL grants in `policies/content-agents.jsonld`, and 3 `address-*` voices) moved to `folio-assistant-core` in M4 (`cat-harness#443`, `folio-assistant-core#181`, `folio-assistant-core#194`).
  - `lean-authoring-agent`, `compute-authoring-agent`, `proof-review-agent` (+ 9 stories, actor extensions `authoring-agent.json` & `review-agent.json`, and 3 `address-*` voices) moved to `folio-assistant-sci` in M4 (`cat-harness#443`, `folio-assistant-sci#56`, `folio-assistant-sci#61`).
  - `lean-toolchain` (+ `lean-mcp` actor, `lean-atlas`/`lean-mcp`/`lean-toolchain` capabilities, `lean-toolchain-contract` skill + test, `req:lean-verification`, and `lean-build`/`lean-toolchain-setup` tools) moved to `folio-assistant-sci` in `syiq` (`cat-harness#566`, `folio-assistant-sci#89`, `folio-assistant-sci#91`).
- **Moved in this batch (2 roles, 3 stories, 2 actors + 2 actor capability extensions, 6 capabilities, 1 ODRL policy, 1 contract skill + test, 1 voice, and 2 `role-skill` extensions)**:
  - `folio-assistant-core` ([PR #246](https://github.com/litlfred/folio-assistant-core/pull/246)): adds `scenarios/capabilities/pandoc.json` and `scenarios/capabilities/html-pdf-engine.json`; removes `skills/voices/address-fhir-modeller/voice.json` (moving to `fhir-harness`).
  - `folio-assistant-sci` ([PR #123](https://github.com/litlfred/folio-assistant-sci/pull/123)): adds `scenarios/capabilities/latex-compiler.json`.
  - `fhir-harness` ([PR #203](https://github.com/litlfred/fhir-harness/pull/203) and stacked voice [PR #204](https://github.com/litlfred/fhir-harness/pull/204)): declares `scenarios` in `fhir-harness.json`; moves whole roles `fhir-modeller` and `ig-publisher-service` into `scenarios/roles.json` (`roles`); moves `qc-reviewer → ig-ast-delta` and `build-pipeline → ig-ast-delta` into `scenarios/roles.json` `extensions` (taking `process-bindings.baseline.ts` in `cat-harness-tools#881` to 0); adds `scenarios/stories.json` (`fhir-modeller-1..3`), `scenarios/actors/{fhir-modeller,ig-publisher-service,qc-reviewer,publication-manager}.json`, `scenarios/capabilities/{fhir-validator,ig-publisher,sushi-compiler}.json`, `policies/ig-publisher-service.jsonld`, `skills/content/fhir-ig-authoring/ig-publisher-service-contract.md`, `schemas/ig-publisher-service-contract.test.ts`, `skills/skills.json`, and `skills/voices/address-fhir-modeller/voice.json`. (`skills/requirements/fhir-validation.json` stays in `cat-harness` because it declares `derivedFrom: "req:content-lifecycle"`, and `kg-audit.ts`'s `requirement-derived-from-resolves` resolves `derivedFrom` within the audited instance's own `skills/requirements/`.)
  - `cat-harness-tools` ([PR #912](https://github.com/litlfred/cat-harness-tools/pull/912)): updates `scripts/tests/actor-facts-audit.test.ts` so `sushi-compiler`, `ig-publisher`, and `fhir-validator` remain in `KNOWN` without failing standalone `cat-harness` runs when moved to `fhir-harness`.
  - `cat-harness` ([PR #747](https://github.com/litlfred/cat-harness/pull/747)): removes the moved roles, stories, actors, capabilities, ODRL grant, `ig-publisher-service-contract` skill + test, and `ig-ast-delta` role bindings; syncs `AGENTS.md`, `SKILLS.md`, and `docs/assets/glossary/cat-harness--kg-skills.skos.jsonld`.
- **Why the remaining 5 roles stay in `cat-harness/scenarios/roles.json` (with higher-layer skills attached via `extensions`)**:
  1. `clinical-sme`: bound by `cat-harness/processes/sdlc/sme-test-data-review.bpmn` (`Lane_SME`, added by bean `vljz`), `folio-assistant-core/processes/content/draft-to-publication.bpmn`, and `fhir-harness/processes/content/questionnaire-wireframe-review.bpmn`. Moving it to `smart-base` would create 3 upward `lane-role` bindings.
  2. `editorial-authoring-agent`: ruled in `cat-harness#443` — 9 of its 10 `cat-harness` skills in `skills/authoring/authoring-core/` have no other role or BPMN activity in `cat-harness`, so moving the role would fail `skill-in-role-or-process`.
  3. `board-renderer`: 7 of its 8 `cat-harness` skills in `skills/ui/ui-core/` (`board-windows`, `board-diagram-interchange`, `harness-tiles`, `visualizer-loading`, `pdf-inline-viewer`, `liquid-templates`, `incremental-render`) have no other role or BPMN activity in `cat-harness`.
  4. `review-coordinator`: carries 4 `cat-harness` skills in `skills/review/review-core/`, of which `review-heatmap` has no other role or BPMN activity in `cat-harness`.
  5. `terminologist`: carries 2 `cat-harness` skills (`code-lists`, `vocabulary-authority`) in `skills/kg/kg-core/`, neither of which has any other role or BPMN activity in `cat-harness`.

_2026-10-30T17:15:00Z_ — All PRs merged: https://github.com/litlfred/folio-assistant-core/pull/246 (6369b1d), https://github.com/litlfred/folio-assistant-sci/pull/123 (9b0eb08), https://github.com/litlfred/fhir-harness/pull/203 (6ca6874), https://github.com/litlfred/fhir-harness/pull/204 (58cc045), https://github.com/litlfred/cat-harness-tools/pull/912 (e714669), then the remover https://github.com/litlfred/cat-harness/pull/747 (9c3b2ae). All four boxes are ticked. Left: the gates in the composed index after the folio-assistant re-pin (CI thread), and the `pzwb` blocker. Session https://claude.ai/code/session_01Qmmkt5WaLSwgbVA8urteie (thread "Land GOAL 1 placement moves").
