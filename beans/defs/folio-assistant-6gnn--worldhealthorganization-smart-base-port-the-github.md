---
# folio-assistant-6gnn
$schema: bean/1.0.0
title: 'WorldHealthOrganization/smart-base: port the .github/skills clean-up and the BPMN validator fixes upstream'
status: todo
type: task
priority: low
tags:
    - smart-base
    - github-skills
    - upstream
created_at: 2026-11-13T12:07:20Z
updated_at: 2026-11-13T12:07:20Z
parent: folio-assistant-95e7
---

## Why

Parent: `folio-assistant-95e7`. WorldHealthOrganization/smart-base `main` has the same `.github/skills/` library and the same defects: validators glob `input/business-processes/*.bpmn` while its BPMN is in `input/bpmn/`; the actor-file convention matches no file; `/validate` only dispatches `ghbuild.yml`, which never calls the skills. Its downstream DAKs fetch only `input/scripts/` (curl from `main`, `ghbuild.yml`), so nothing under `.github/skills/` reaches them. It has no KG yet, so the target there is `input/scripts/`, not a subgraph.

Blocked on bean `folio-assistant-hhkw` and on bean `folio-assistant-tgaj`: port what those settle.

## Done when

- [ ] An upstream PR deletes the dead `.github/skills/` parts and moves any surviving validator into `input/scripts/` with the path and naming bugs fixed.
- [ ] `input/pagecontent/authoring-skills.md` upstream no longer links to `.github/skills/`.
