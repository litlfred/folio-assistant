---
# folio-assistant-3g13
title: 'PLATFORM BOUNDARY: bpmn-authoring and dmn-authoring sit in a CONTENT-TYPE package'
status: todo
type: task
priority: normal
created_at: 2026-09-20T06:33:44Z
updated_at: 2026-09-20T06:34:03Z
parent: folio-assistant-zzmr
---

Measured 2026-09-20 while building the `workflow` package (bean `ugid`). `bpmn-authoring` and `dmn-authoring` live in `skills/authoring-who-smart-guidelines/` — a content-type package — while BPMN and DMN are platform machinery every process in this repository uses.

It is not a judgement call. `bpmn-authoring`'s own first line says it covers 'both a DAK's L2 business processes AND this repository's own `skills/workflows/*.bpmn`'. Five of its six sections are generic; exactly one, '## For a DAK', is WHO-specific. It is named by `crdm-requirements.bpmn` — a PLATFORM process — from the `Agent` lane. So a platform process depends on a skill housed in a domain package, which is the boundary `platform-boundary-guard` exists to keep.

## Why it was NOT moved in ugid

A blocker worth stating before anyone tries: **no package manifest declares a dependency on another package.** `SkillPackageManifestSchema` has no such field, and no manifest references `folio-core`. Skill refs resolve by NAME across every package, so moving these two would not break resolution — but `authoring-who-smart-guidelines` is 'synced into a content repo as a bundle', and there is no way to express that the WHO bundle now needs `workflow/`. Moving them would quietly change what a WHO folio's sync carries.

So the move waits on the composition question, and this bean is where the measurement lives meanwhile.

## Done when

- [ ] decide whether a manifest may declare a package dependency, or whether a generic skill named by a domain package is resolved some other way
- [ ] move `bpmn-authoring` and `dmn-authoring` into `skills/workflow/`, with '## For a DAK' kept as a worked case rather than split out
- [ ] a check that a skill named by a PLATFORM diagram does not live in a content-type package — the defect had nothing watching it
