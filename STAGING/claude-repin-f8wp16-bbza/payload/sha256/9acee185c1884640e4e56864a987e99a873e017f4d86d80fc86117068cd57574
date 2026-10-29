---
# folio-assistant-w2hn
$schema: bean/1.0.0
title: 'QA: beans tied to no BPMN task, reported as a warning and clustered to find undocumented processes'
status: completed
type: task
priority: normal
created_at: 2026-10-24T08:05:00Z
updated_at: 2026-10-24T10:00:00Z
parent: folio-assistant-yj32
---

Owner, 2026-10-24: *"should be QA report, way to find beans that are not a part of a process.... a bean should be assocaited to >= 1 task ideally. (some beans may be for porcesses not yet in KG, so not failure, but if lots of beans like this, maybe group and see if they are part of undocumented porocess)"*

Follows `v49e` (cat-harness-tools#684), which measured 1,084 of 1,094 beans in no workflow instance.

## Default taken (owner may overrule)
A bean counts as tied to a task when (a) a workflow instance names it (`bean`, or a step's history), or (b) the bean names a BPMN process or activity id that exists in a declared diagram (inferred, and shown as such). Anything else is **unlinked**: a WARNING, never a failure.

## Done when
- [x] a QA report lists unlinked open beans, with the link basis (instance / named id / none) for every bean
- [x] unlinked beans are grouped (reusing `pipeline/lsi.ts` / `scripts/lsi-epics.ts`), and each large group is shown as a candidate undocumented process with its beans
- [x] severity is warning; the report never fails a build

Session https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3.

_2026-10-24T10:00:00Z_ — **Completed.** cat-harness-tools#703 merged as 13570ae. Report: `bun run cat check:unlinked-beans`; result `test/results/unlinked-beans.qa-results.json`, rendered in each bean store page's `#unlinked-beans` section. First run: 152 open beans, 136 unlinked (89%), 15 candidate groups of 5 or more. Side finding: the store's beans.json no longer declares `defs/archive`, so 631 archived beans are unread. Session https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3.
