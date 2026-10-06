---
# folio-assistant-5uyl
title: Extract the immunizations L1 graph from DAK Component 1 into smart-immunizations/library
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T08:58:14Z
updated_at: 2026-10-06T09:39:52Z
parent: folio-assistant-ioa4
---

## Done when
- [x] the DAK PDF is ingested by folio-assistant and its entry placed under smart-immunizations/library/
- [x] a generic extractor reads Component 1 (§1.1 interventions, §1.2 cited guidance) and resolves each (n) against the reference list
- [x] the graph validates with smart-kg tools/validate.mjs at WHO main AND the Zod validator in smart-base
- [ ] every cited reference with a retrievable PDF is ingested into the same library; the rest are recorded with why not

## Progress 2026-10-06
- litlfred/smart-immunizations@a43629c (branch claude/happy-pasteur-pav8ba): library/ holds the DAK + (31) + (28); graph smart-kg-l1-dak-references.json, 52 nodes / 53 edges, conforms under smart-kg validate.mjs (WHO main 66a9b13) and the smart-base Zod validator.
- Item 4 open: (15) PAHO IRIS returned 403 and (26) (32) are on www.who.int, both denied by this session's network policy; (24) (29) are web pages, (30) a spreadsheet. Each is recorded in the graph with its URL.
