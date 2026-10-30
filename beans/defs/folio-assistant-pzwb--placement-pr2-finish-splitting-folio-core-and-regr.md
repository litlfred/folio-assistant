---
# folio-assistant-pzwb
$schema: bean/1.0.0
title: 'Placement PR2: finish splitting folio-core and regroup the harness skill topics'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-30T17:15:00Z
parent: folio-assistant-9umr
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR2: finish splitting `folio-core` and regroup the harness skill topics. **Partly landed** (bean `9umr`, 2026-10-01): #1729 moved the 46 SDLC skills into `skills/sdlc/sdlc-core`, crdm and spec-kit into `skills/sdlc/`; #1734 moved `upload-routes`. Measured on main `b0ca040` 2026-10-01: `cat-harness/skills/folio-core/` still holds the 5 tool-surface skills (`mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `covered-is-not-reachable`); editorial skills that belong to core (`folio-editorial` 14, `one-voice` 3) and sci (`paper-editorial` 6) are still in `skills/authoring/authoring-core/`.

Remaining: tool-surface skills → a `tools` topic; core/sci editorial skills up; `process/workflow/{branch-freshness,code-review-process,release-lifecycle,release-epic-planning}` → `sdlc/sdlc-core`; `content-lifecycle` per ruling 1 (A — harness, generalised; 7 definitions back down from core; FHIR/Lean/qou bullets to owner refinements); `conduct-core/{getting-started,repo-conversion}` → core `conduct/onboarding/`; `ui-core/{board-windows,board-diagram-interchange}` → core `ui/boards/`; new core skill `block-change-summary`.

Waits on PR1 (`ybwt`, not yet on main — link when it lands).

## Done when
- [x] no `cat-harness/skills/folio-core/` directory remains (cat-harness#518, merged a334cf9, 2026-10-24: moved to `skills/tools/folio-core/` under a new `tools` topic)
- [x] every topic in `skills/skills.json` holds at least one package; the harness holds no skill placed above it by proposal §1.2 (litlfred/folio-assistant-core#240 + litlfred/cat-harness#728, litlfred/folio-assistant-sci#120 + litlfred/cat-harness#738, litlfred/folio-assistant-core#250 + litlfred/cat-harness#758)
- [x] `knownSkills(checkout)` equals PR1's set plus `block-change-summary` (litlfred/folio-assistant-core#240 + litlfred/cat-harness#728)
- [ ] `skill:register:check`, `kg:audit:check`, `check:agents-xref`, `bun run cat gates` green

## State 2026-10-09 — still open after the cutover
measured in the composed index checkout (folio-assistant 28283d2b9f; cat-harness mounted at bd72c68, cat-harness-tools at 3ce5100): `cat-harness/skills/folio-core/` still exists, holding `covered-is-not-reachable`, `mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `tool-authoring` (+ package-manifest). Box 1 not met; the rest not re-measured. This is now a PR to litlfred/cat-harness (and to core/sci for the editorial skills that move up). Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured by file name: 14 of 28 rows are in their target, 14 still in cat-harness.

_2026-10-24T08:16:00Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx (bean drain, stalled-triage thread).

_2026-10-29T08:05Z_ — Lane A (session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo; the 10-24 stalled-triage claim had lapsed) merged two PRs. litlfred/cat-harness#659 moved `process/workflow/{branch-freshness,code-review-process,release-epic-planning,release-lifecycle}` to `sdlc/sdlc-core`. litlfred/cat-harness#661 moved `deployment-auth` to `skills/tools/folio-core/`. The audit's crdm and spec-kit rows are out of date: #1729 placed them under `skills/sdlc/`. Still open, and each needs a split, not a move: `conduct-core/{getting-started,repo-conversion}` and `ui-core/{board-windows,board-diagram-interchange}`, which harness code names (site-chrome js/css, `schemas/semantic-zoom.ts`, `scenarios/roles.json`, `cat-harness.json`), so moving them to core adds wrong-direction edges. The core/sci editorial skills: the audit marks most of them SPLIT, with only a passage moving up. `evidence-appraisal` stays under ruling 1 (content-lifecycle stays in the harness). New core skill `block-change-summary` isn't written yet.


## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured by file name: 14 of 28 rows are in their target, 14 still in cat-harness.

_2026-10-24T08:16:00Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx (bean drain, stalled-triage thread).

## Merged from the cat-harness copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: (three-way hunk)

```text
updated_at: 2026-10-24T11:36:00Z
parent: folio-assistant-iirv
```

## 2026-10-30 — `delivery-summary` → `block-change-summary` split opened

- **litlfred/folio-assistant-core#240** (`claude/pzwb-block-change-summary`): authors `skills/content/content-lifecycle-ext/block-change-summary.md` (extracted from §2 of `delivery-summary.md`), registers it in `skills/content/content-lifecycle-ext/package-manifest.json`, extends `authoring-agent` in `scenarios/roles.json`, and syncs `AGENTS.md`.
- **litlfred/cat-harness#728** (`claude/pzwb-delivery-summary-split`): slims `skills/sdlc/sdlc-core/delivery-summary.md` to the generic SDLC delivery summary (restart command, file blob/commit/diff/viewer links, staging-review deep-link rule) with zero upward references, and updates `test/results/kg-qa/skills/sdlc/sdlc-core/delivery-summary.kg-qa.json`.
- Verified in composed checkout: `skill:register:declarations:check` (383 skills across 34 packages), `skills:docs:check`, `readme:sync -- --dir folio-assistant-core --check`, `readme:sync -- --dir cat-harness --check`, `check:agents-xref` (0 unresolved), and `placement-pr1-content-up.test.ts` + `placement-pr0-mechanisms.test.ts` + `skill-manifest-coverage.test.ts` (39 pass, 0 fail).
- Remaining on `pzwb` (box 2): the editorial / onboarding / board skill splits noted on 2026-10-29 (`getting-started`, `repo-conversion`, `board-windows`, `board-diagram-interchange`, and the editorial SPLIT rows), where harness code/roles/chrome still reference the harness copies. Every topic in `cat-harness/skills/skills.json` already holds at least one package (`kg` 3, `library` 2, `ui` 2, `conduct` 2, `process` 3, `authoring` 2, `tools` 1, `sdlc` 3).

## 2026-10-30 — `authoring-core` paper editorial `SPLIT` skills (`chapter-complexity-review`, `block-density`, `one-voice-audit`, `one-voice-integration-watcher`) + upward-ref cleanup opened

- **litlfred/folio-assistant-sci#120** (`claude/pzwb-paper-editorial-splits`): authors `skills/content/authoring-math/paper-chapter-complexity.md` (the paper-folio half of `chapter-complexity-review` and `block-density`: mathematical vs. narrative `LOGICAL_SRC`/`LOGICAL_TGT`/`NARRATIVE_SRC` block-kind sets, cross-paper `<paper-dir>:<label>` filtering, >5-row table extraction from formal statement blocks) and `skills/content/authoring-math/paper-voice-audit.md` (the paper-folio half of `one-voice-audit` and `one-voice-integration-watcher`: `.lean` proof docstring voice rules, mathematical hedging phrases, `pdflatex` Unicode math replacements, conditional-theorem banner and precision-proposition exceptions, paper watcher triggers and specialist dispatch), registers both in `skills/content/authoring-math/package-manifest.json`, extends `editorial-authoring-agent` and `integration-watcher` in `scenarios/roles.json`, and syncs `AGENTS.md`.
- **litlfred/cat-harness#738** (`claude/pzwb-authoring-core-splits`): slims `chapter-complexity-review.md`, `block-density.md`, `one-voice-audit.md`, and `one-voice-integration-watcher.md` to their generic editorial/watcher rules, removes the remaining upward prose skill-id mentions in `one-voice-style-guide.md` and `readability-editing.md` (Ruling B of 2026-10-24), drops the stale `cat-harness/voices/technical-writer.json` reference in `technical-documentation.md` (proposal §0 & §5), and refreshes `source_hash` in the 7 `.kg-qa.json` sidecars under `test/results/kg-qa/skills/authoring/authoring-core/`.
- Verified in composed checkout: `skill:register:declarations:check` (385 skills across 34 packages), `skills:docs:check`, `readme:sync -- --dir folio-assistant-sci --check`, `readme:sync -- --dir cat-harness --check`, `check:agents-xref` (0 unresolved), `check:process-bindings` (0 wrong-direction), `kg:detangle:direction` (0 wrong-direction), and `placement-pr1-content-up.test.ts` + `placement-pr0-mechanisms.test.ts` + `skill-manifest-coverage.test.ts` + `voices-viz.test.ts` (62 pass, 0 fail).

## 2026-10-30 — Batch 3: remaining PR2 onboarding, boards, `content-lifecycle` and `authoring-core` splits opened (box 2 satisfied)

Full audit of all 28 `pzwb (PR2)` rows in `cat-harness/docs/proposals/placement-audit-2026-10-01.json` and `placement-concern-groups-2026-10-01.md` §2 PR2:
- **Rows 4–8 & 16** (`covered-is-not-reachable`, `mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `deployment-auth`): moved to `cat-harness/skills/tools/folio-core/` in `cat-harness#518` and `cat-harness#661`.
- **Rows 9–12** (`branch-freshness`, `code-review-process`, `release-epic-planning`, `release-lifecycle`): moved to `cat-harness/skills/sdlc/sdlc-core/` in `cat-harness#659`.
- **Rows 13–15 & 17** (`crdm-data-model`, `crdm-detect`, `crdm-requirements-workflow`, `spec-kit`): placed under `cat-harness/skills/sdlc/crdm/` and `cat-harness/skills/sdlc/spec-kit/` by `#1729`.
- **Rows 20–28** (`board-positions.ts`, `board.ts`, `carried-note.ts`, `note-anchor.ts`, `window-stack.ts` and their `.test.ts`): regrouped to `cat-harness/schemas/ui/` and `scripts/tests/{ui,content}/` under Ruling 4A (`f8wp`, PR8) because harness chrome and scripts import them.
- **Batch 1** (`delivery-summary` → `block-change-summary`): **litlfred/folio-assistant-core#240** + **litlfred/cat-harness#728**.
- **Batch 2** (`authoring-core` paper editorial `SPLIT` skills `chapter-complexity-review`, `block-density`, `one-voice-audit`, `one-voice-integration-watcher`, plus `one-voice-style-guide`, `readability-editing`, `technical-documentation`; paper skills `formal-accuracy`, `formal-layer-editing`, `math-md-authoring`, `math-readability-editing`, `devils-advocate-paper`, `lean-content-test`, `math-render-check`, `uses-formal-comparison` already created in `folio-assistant-sci` by `syiq`): **litlfred/folio-assistant-sci#120** + **litlfred/cat-harness#738**.
- **Batch 3** (remaining PR2 rows 1–3, 18–19, `content-lifecycle` under Ruling 1, and remaining `authoring-core` / `ui-core` upward refs):
  - **litlfred/folio-assistant-core#250** (`claude/pzwb-core-onboarding-boards-editorial`, commit `2d06428`): authors `folio-getting-started.md`, `folio-repo-conversion.md`, `folio-board-windows.md`, `folio-board-diagram-interchange.md`, `folio-content-lifecycle.md`, `folio-content-profiles.md`, and `folio-editorial-workflow.md` in `skills/content/folio-document-adapter/` (linking downward to the generic harness skills and carrying the upper-layer BPMN/DMN bindings, `describeRepository()` content-type routing, board window/filter rules, content-type lifecycle stage dispatch, `block-kinds/` profile rules, and glossary/editorial coordination), registers them in `skills/content/folio-document-adapter/package-manifest.json`, extends `onboarding-agent`, `editorial-authoring-agent`, and `board-renderer` in `scenarios/roles.json`, and syncs `AGENTS.md`.
  - **litlfred/cat-harness#758** (`claude/pzwb-onboarding-boards-lifecycle-splits`, commit `1581d40c`): generalises `skills/conduct/conduct-core/{getting-started,repo-conversion}.md`, `skills/ui/ui-core/{board-windows,board-diagram-interchange,html-rendering-qc,render-order}.md`, `skills/authoring/content-lifecycle/{content-author,content-feedback,content-plan,content-publish,content-review,content-test,content-validate,evidence-appraisal}.md`, and `skills/authoring/authoring-core/{canonical-watcher,content-graph,content-profiles,devils-advocate-watcher,editor,evidence-review,exposition-swarm-drain,md-authoring,uses-editorial-review}.md` (removing all upward references to `folio-assistant-core`, `folio-assistant-sci`, `fhir-harness`, and `smart-base` skills/diagrams and dropping `adapters`/`profiles` frontmatter from `board-*`), and updates `source_hash` in the 23 `.kg-qa.json` sidecars.
- Verified in composed checkout: `skill:register:declarations:check` (376 skills across 34 packages), `skills:docs:check` (up to date), `readme:sync -- --dir folio-assistant-core --check`, `readme:sync -- --dir cat-harness --check`, `check:agents-xref` (0 unresolved), `check:process-bindings` (0 wrong-direction), `kg:detangle:direction` (0 wrong-direction), and `placement-pr1-content-up.test.ts` + `placement-pr0-mechanisms.test.ts` + `skill-manifest-coverage.test.ts` + `skill-coverage.test.ts` (43 pass, 0 fail).

_2026-10-30T17:15:00Z_ — All PRs merged, receivers first: https://github.com/litlfred/folio-assistant-core/pull/240 (f06eed6) then https://github.com/litlfred/cat-harness/pull/728 (112635b); https://github.com/litlfred/folio-assistant-sci/pull/120 (72a6079) then https://github.com/litlfred/cat-harness/pull/738 (4d91459); https://github.com/litlfred/folio-assistant-core/pull/250 (61bc961, AGENTS.md skill index merged to 38 skills) then https://github.com/litlfred/cat-harness/pull/758 (b3b6b7f, kept the layer-neutral repo-conversion wording; the IG detail is in fhir-harness `ig-build-pipeline`). Left: box 4, the gates in the composed index after the folio-assistant re-pin (CI thread). Session https://claude.ai/code/session_01Qmmkt5WaLSwgbVA8urteie (thread "Land GOAL 1 placement moves").
