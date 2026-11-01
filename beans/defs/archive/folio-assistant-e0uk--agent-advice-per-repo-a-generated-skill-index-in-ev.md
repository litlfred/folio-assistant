---
# folio-assistant-e0uk
$schema: bean/1.0.0
title: 'AGENT ADVICE PER REPO (phase 1): a generated, drift-checked skill index in every repo''s AGENTS.md'
status: completed
type: feature
priority: normal
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-29T12:45:00Z
parent: folio-assistant-7x5n
---

Owner, 2026-10-24 09:49Z: *"all repos should have agentic advice (e.g. based on the skills that they publish)"*. Card answered 13:15Z: **D. Index now, rest where useful**. Measurements and options: `/mnt/project-files/agent-advice/per-repo-agent-advice-2026-10-24.md` (project files).

## Current state (measured 2026-10-24)
Only the folio-assistant aggregate has a generated agent surface (50 skill commands, 2 agents + memory, the MCP skill server, vendor agent files from 31ni). The 11 layer repos each have a hand-written AGENTS.md only; nothing ties it to the skills the repo publishes (cat-harness 258, sci 89, core 33, smart-base 26, fhir-harness 17, bootstrap 14, who-iris 7, bootstrap-tools 4). sci and core link none of their 122 skills.

## Design
A new section in `cat-harness-tools/pipeline/readme-sections.ts` (the registry already writes marked regions into AGENTS.md, e.g. `cat-harness:cold-start`), written only where its markers appear, listing the skills THIS repo publishes (its own, not inherited, so a skill added upstream does not churn downstream repos). `readme:sync:check` gates it in `layer-pr-checks.yml`.

Tension with an earlier ruling: the cold-start section (owner 2026-09-20, "be careful to do this to minimize drift") deliberately never lists skills, because "a README is the one file no check reads". A generated region under `readme:sync:check` IS read by a check, but the shape (full list vs. categories plus a query pointer) goes to the owner first.

## Todo
- [ ] Owner picks the index shape.
- [x] Section + test in cat-harness-tools; definition note in cat-harness (Tool definition and the skill page that names the section).
- [ ] Markers added to each layer repo's AGENTS.md, one PR per repo (litlfred repos only; no WHO repo).
- [ ] `readme:sync:check` runs in every layer's PR checks.

## Done when
Every litlfred layer repo's AGENTS.md carries the generated skill index for the skills it publishes, and CI fails when it drifts.

Follow-up (phase 2): folio-assistant-t5zb.

_2026-10-29T12:50:00Z_ — Box 1 merged: litlfred/cat-harness#573 (the `cat-harness:skills` ReadmeSection, now in `schemas/tools/tool-types.ts`) and litlfred/cat-harness-tools#746 (the section and its test). Owner card 2026-10-29 12:22Z: option A, ship as built (over 32 KB an AGENTS.md gets a folder table plus a SKILLS.md). Next: box 2, the markers, one PR per litlfred layer repo. Session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo.

## Done (2026-10-29)

Writer cat-harness-tools#746 and definition cat-harness#573 merged. One PR per litlfred layer added the region, all merged under the owner's merge-ready rule: cat-harness#694 (249 skills, full list in SKILLS.md past the 32 KiB budget), folio-assistant-sci#108 (68), folio-assistant-core#225 (30), smart-base#184 (23), fhir-harness#186 (16), bootstrap#30 (13), bootstrap-tools#48 (3), who-iris#87 (2). No WHO repository touched.

Generated over the composed tree (folio-assistant 8633ba8): a layer read alone misses skills in topics a lower layer declares, e.g. core's `content` topic (sci shows 6 alone, 68 composed).

`readme:sync:all:check` gates the region from the first folio-assistant re-pin of cat-harness-tools at or past d824b7e. Phase 2 is t5zb.
