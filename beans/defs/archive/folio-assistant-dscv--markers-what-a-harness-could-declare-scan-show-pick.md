---
# folio-assistant-dscv
$schema: bean/1.0.0
title: 'Markers: what a harness could declare — scan, show, pick (declare, don''t slurp)'
status: completed
type: feature
priority: normal
created_at: 2026-10-30T13:20:00Z
updated_at: 2026-10-30T18:00:00Z
---

Owner, 2026-10-30T12:41Z: "a harness can point to a repo, but doesnt want to automatically slurpo up all content in a repo. harness desclares what it it pays attention to in the repo." 12:43Z: a process/skill that looks through the repo for KG content markers (sushi-config etc.) and generates a list of what can be harnessed and potentially declared in index.config.json. 12:44Z: link it to harness initiation — ask the person which parts of the repo to load into the KG. 12:45Z: works across every agentic harness.

Cross-link: litlfred/aai-programme#26.

## Done when
- [x] `scan-repo-content.ts` reports a fourth section, `markers` (paths, declared/not-declared/unknown, suggested snippet), with `--json` and a `--markers` mode for an existing instance — cat-harness-tools
- [x] content types read from the registry (`defaultContentTypes`, `{ indexSection }`), directory facets checked against `BASE_GRAPH_TYPOLOGIES`; the rest is one explicit evidence table
- [x] `getting-started.bpmn` gains `Task_ChooseHarnessed` (selectable options only; nothing declared unpicked), checklist and picture updated — folio-assistant-core
- [x] `repo-conversion.md` §2a: markers and "declare, don't slurp" — cat-harness
- [x] owner has seen the proposal; PRs merged on the owner's word (coordinator: open, don't merge)
- [ ] TODO(ig): when fhir-harness registers `ig`, read its evidence from the registry and drop the hint row

## 2026-10-30 progress
- Draft PRs (proposal; coordinator: open, don't merge until the owner says): litlfred/cat-harness-tools#870 (scanner `markers`), litlfred/cat-harness#721 (`repo-conversion` §2a), litlfred/folio-assistant-core#235 (`Task_ChooseHarnessed`).
- Cross-linked on litlfred/aai-programme#26.
- Left: owner review; `bpmn:checklist:check` in CI on #235 (checklist hand-regenerated); TODO(ig) once fhir-harness registers `ig`.

_2026-10-30T18:00:00Z_ — Completed. The owner merged all three PRs at 15:38Z: [litlfred/cat-harness-tools#870](https://github.com/litlfred/cat-harness-tools/pull/870) (scanner `markers`), [litlfred/cat-harness#721](https://github.com/litlfred/cat-harness/pull/721) (`repo-conversion` §2a) and [litlfred/folio-assistant-core#235](https://github.com/litlfred/folio-assistant-core/pull/235) (`Task_ChooseHarnessed`). The `TODO(ig)` box is a conditional follow-up that waits on fhir-harness registering `ig`, and it stays in the code as `TODO(ig)`. (Thread "Fix publish failure and orphan beans", https://claude.ai/code/session_01Qmmkt5bHqcmhAXH3s3z4s5)
