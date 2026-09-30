---
# folio-assistant-rogk
title: 'B9a (#1168): alternatives are DERIVED — delete Tool.alternativeTo'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T10:54:25Z
updated_at: 2026-09-30T11:00:04Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: "why tools need alternativeTo? skills and tools are associated, the alternatives should be derivable" — chose Derive + fix 3.

Rule: two Tools are alternatives iff they share a satisfied skill AND have the same full io signature (input name/schema/required, output name/schema) AND the same renders/maintains. Measured over 118 tools: 8 pairs, recovering all 5 declared (beans-cli/manual, ingest-stdlib/extended, 3 transcribers); 3 false positives from under-typed data (tabular-csv/xlsx, schema-docs/skill-docs, logical-model-schemas/valueset-schemas), each fixed by typing that tool more precisely.

## Done when
- [ ] alternativeTo removed from the schema and every tool
- [ ] one derivation function, used by check-tools, kg-export and the tools viewer
- [ ] the 3 false positives typed away; derived set == the 5 declared pairs
- [ ] selection still required when a tool has a derived alternative
