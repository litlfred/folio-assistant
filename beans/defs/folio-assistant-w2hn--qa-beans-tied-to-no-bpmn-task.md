---
# folio-assistant-w2hn
title: 'QA: beans tied to no BPMN task, reported as a warning and clustered to find undocumented processes'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T08:05:00Z
updated_at: 2026-10-24T08:05:00Z
parent: folio-assistant-yj32
---

Owner, 2026-10-24: *"should be QA report, way to find beans that are not a part of a process.... a bean should be assocaited to >= 1 task ideally. (some beans may be for porcesses not yet in KG, so not failure, but if lots of beans like this, maybe group and see if they are part of undocumented porocess)"*

Follows `v49e` (cat-harness-tools#684), which measured 1,084 of 1,094 beans in no workflow instance.

## Default taken (owner may overrule)
A bean counts as tied to a task when (a) a workflow instance names it (`bean`, or a step's history), or (b) the bean names a BPMN process or activity id that exists in a declared diagram (inferred, and shown as such). Anything else is **unlinked**: a WARNING, never a failure.

## Done when
- [ ] a QA report lists unlinked open beans, with the link basis (instance / named id / none) for every bean
- [ ] unlinked beans are grouped (reusing `pipeline/lsi.ts` / `scripts/lsi-epics.ts`), and each large group is shown as a candidate undocumented process with its beans
- [ ] severity is warning; the report never fails a build

Session https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3.
