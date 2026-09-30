---
# folio-assistant-eowd
title: 'REGEN CANNOT REPAIR translate-bpmn:check: its derived writer ''translate-bpmn'' needs --extract, so regen reports a stale template as ''a real defect'''
status: todo
type: bug
priority: normal
created_at: 2026-09-30T09:25:14Z
updated_at: 2026-09-30T10:05:44Z
parent: folio-assistant-1xhc
---

Found 2026-09-30 while adding a step to document-ingestion.bpmn (bean 7bg9).

regen-after-merge.ts writerFor() derives a check's writer by dropping ':check': translate-bpmn:check → translate-bpmn. But 'bun run translate-bpmn' with no flags only reports; the writing mode is '--extract'. So after any diagram edit, bun run regen prints:
  ✗ translate-bpmn:check STILL fails after `bun run translate-bpmn` — a real defect, not staleness
and exits non-zero, while 'bun run translate-bpmn -- --extract' fixes it in one run. The check's own message names the right command.

Same class as 14ve: regen's verdict ('a real defect') is wrong about a plain staleness, which teaches the reader to distrust the one line meant to be trusted.

## Done when
- [ ] regen repairs translate-bpmn:check (a translate-bpmn:extract writer script, or an explicit override in writerFor — reported, not silent)
- [ ] a test pins that every check regen maps to a writer names a writer that WRITES (a writer run that leaves its check failing on a fresh stale fixture is a finding)


*2026-09-30, same day* — a SECOND check regen does not repair: audit:coverage:strict / audit:coverage:require-all. After a regen that reported '65 current, 0 regenerated', audit:coverage:strict still failed ('the committed sidecar … disagrees with this run'); 'bun run audit:coverage' fixed it at once. Its writer is not derivable by dropping ':strict' / ':require-all', so regen never runs it. Seen three times in this session. The Done-when test should cover every check whose writer is not '<check minus :check>'.
