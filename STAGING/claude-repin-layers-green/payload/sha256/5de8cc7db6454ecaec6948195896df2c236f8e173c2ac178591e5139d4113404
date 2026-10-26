---
# folio-assistant-e0uk
$schema: bean/1.0.0
title: 'AGENT ADVICE PER REPO (phase 1): a generated, drift-checked skill index in every repo''s AGENTS.md'
status: todo
type: feature
priority: normal
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-24T13:20:00Z
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
- [ ] Section + test in cat-harness-tools; definition note in cat-harness (Tool definition and the skill page that names the section).
- [ ] Markers added to each layer repo's AGENTS.md, one PR per repo (litlfred repos only; no WHO repo).
- [ ] `readme:sync:check` runs in every layer's PR checks.

## Done when
Every litlfred layer repo's AGENTS.md carries the generated skill index for the skills it publishes, and CI fails when it drifts.

Follow-up (phase 2): folio-assistant-t5zb.
