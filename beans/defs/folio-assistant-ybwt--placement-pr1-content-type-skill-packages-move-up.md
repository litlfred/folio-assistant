---
# folio-assistant-ybwt
title: 'Placement PR1: content-type skill packages move up to their owning instances'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T05:31:12Z
updated_at: 2026-10-01T05:31:19Z
parent: folio-assistant-9umr
---

PR1 of the approved placement proposal (owner rulings 2026-09-30; bean 9umr's eight groups; PR0 mechanisms in bean ejye). Move the content-type skill packages out of `cat-harness/skills/` to the instance that owns them, into the `content` / `library` concern group there:

- paper / formal-math (`folio-paper-adapter`, `authoring-math`) and the three `claude-scientific-skills` packages -> `folio-assistant-sci/skills/content/`
- `document-intake` -> `folio-assistant-core/skills/library/ingestion/`
- `folio-document-adapter` -> `folio-assistant-core/skills/content/`
- WHO SMART (`authoring-who-smart-guidelines`) -> `smart-base/skills/content/`
- `fhir-validation`, `ig-publication`, `l3-fhir-authoring`, `terminology-management` (+ the `smarter-fhir` remote package) -> `fhir-harness/skills/content/fhir-ig-authoring/` (#1702)
- `quality-control` -> `folio-assistant-core/skills/content/content-lifecycle-ext/` (#1702)

kg-qa sidecars and `schemas/skills/<skill>/` travel with their skill. Role->skill edges naming a moved skill move to the owner's `scenarios/roles.json` extension (PR0b). `content-lifecycle` stays in the harness, generalised (ruling 1) — not part of this PR.

## Done when

- [ ] a search for `cat-harness/skills/<moved package>/` finds nothing outside `beans/`
- [ ] no cat-harness file names a moved skill by path or by role edge
- [ ] corpus `knownSkills` unchanged; `skill:register`, `regen`, `gates` green, or each failure proven pre-existing on 9962556
