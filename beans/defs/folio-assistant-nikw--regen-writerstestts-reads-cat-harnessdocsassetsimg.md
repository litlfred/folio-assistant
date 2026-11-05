---
# folio-assistant-nikw
$schema: bean/1.0.0
title: regen-writers.test.ts reads cat-harness/docs/assets/img/workflows, which cat-harness main no longer commits
status: in-progress
type: bug
priority: normal
created_at: 2026-11-05T17:31:39Z
updated_at: 2026-11-05T17:37:26Z
parent: folio-assistant-4j43
---

Every cat-harness-tools PR tested against cat-harness main now fails `test/coordinator/regen-writers.test.ts > render:bpmn:check: red on a staled artefact…` with ENOENT at firstCommittedIn (line 69): litlfred/cat-harness@8cc73584 (2026-11-05, 'Build the whole workflows folder at publish; commit own drawings beside each .bpmn') removed docs/assets/img/workflows/. The case must find an own committed drawing beside a .bpmn instead. Seen on cat-harness-tools#1531 (proven not that PR's). Base-exact passes only on a base-cache hit with an older cat-harness.

## Done when
- [ ] the render:bpmn case picks a committed drawing where cat-harness now keeps them, and passes against cat-harness main
