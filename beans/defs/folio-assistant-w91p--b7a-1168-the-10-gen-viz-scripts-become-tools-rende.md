---
# folio-assistant-w91p
title: 'B7a (#1168): the 10 gen-*-viz scripts become Tools (renders:, maintains:); coverage.visualiser removed'
status: todo
type: task
priority: normal
created_at: 2026-09-24T19:50:21Z
updated_at: 2026-09-24T19:50:21Z
parent: folio-assistant-tr05
---

Owner 2026-09-24: 'A: viz scripts become Tools'. 36 coverage.visualiser entries (23 single, 13 lists); none of the 10 gen-*-viz scripts is a declared Tool (tools/index.ts has 61). Each becomes a Tool with renders: <graph kind> and maintains: its pages; per-instance pages computed from Tool + directory id; the 13 lists need a rule. Derive each directory's viewers; remove coverage.visualiser.
