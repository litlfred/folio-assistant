---
# folio-assistant-t5j5
title: 'kg-audit: a call activity whose target is loadable from the PARENT root must resolve, not read unknown'
status: todo
type: task
priority: normal
created_at: 2026-10-04T09:08:59Z
updated_at: 2026-10-04T09:08:59Z
---
Owner, 2026-10-04: the audit should resolve across instances.

Today a `bpmn:callActivity` whose target process lives in a DIFFERENT declared instance reads `unknown`, with evidence that says in as many words that the audit cannot tell two different things apart:

    CallActivity_Basic: calls "Process_Ingestion", which is the id of no
    process this instance can load. That is either a typo or a process
    hosted elsewhere, and this audit cannot tell which - so it is
    recorded as unknown.

Both of those are real and they are not the same finding. A typo is a defect; a process hosted elsewhere is the DESIGNED inversion - `library-ingestion.md` says a higher-layer process calls `Process_Ingestion` as its first step, and that a harness process naming a higher one would be an upward edge. So every correct downward call reads `unknown`, which is honest but uninformative.

Measured on the #1898 branch (two instances of it, in `the-pipeline.kg.json` and `the-l1-completeness-gate.kg.json`): callers in `folio-assistant-core/processes/library/l1-document-ingestion.bpmn`, targets `Process_Ingestion` in `cat-harness/processes/library/document-ingestion.bpmn` and `Process_IngestTheme` in `cat-harness/processes/ui/ingest-theme.bpmn`. Both targets are loadable from the repository root; neither is loadable from the instance the audit was run for.

The roll-up moves with it, which is the part that misleads a reader: `qa-witness/v1` goes `fail 23 -> 22`, `unknown 35 -> 37`. One fewer failure on the tile, for a reason that is not an improvement.

## Done when
- [ ] a call activity whose target resolves from the parent root is a PASS, with the hosting instance named in the evidence
- [ ] a call activity whose target resolves nowhere is still a FAIL, not unknown - the typo case keeps its verdict
- [ ] `unknown` is left only for what is genuinely undeterminable, per bean 1xhc (a step that did not fire must not look like one that passed)
- [ ] instance-graph isolation is NOT weakened: the parent may be consulted to ANSWER the question, without declaring the nested instance directories here (the leak instance-graph-isolation.test.ts guards)
