---
# folio-assistant-mffs
title: L1 specialisation of library entries (smart-kg 3.0) + DAK references reshaped to 3.0
status: in-progress
type: task
priority: normal
created_at: 2026-10-07T12:37:50Z
updated_at: 2026-10-07T14:28:39Z
parent: folio-assistant-ioa4
---

Owner rulings 2026-10-07: library is upstream of L1; L1 publication/section/element specialise library nodes (prov:specializationOf); L1 membership recorded from declared > context > inferred; DAK citations reshaped to L1 3.0 (citation numberedAs reference-entry resolvesTo publication | library-node). Schema: litlfred/smart-base kg/ (l1-library layer).

## Progress 2026-10-07
- Done in PR #2421: router fix, intake classifications, l1-membership, l1-specialise, l1-kgid, DAK extractor on 3.0, skill/BPMN, allowlist.
- litlfred/smart-immunizations#3: re-ingested; LNOB L1 graph; DAK references graph. Both pass the Zod validator.
- TOC defects reported on #2302.
## Remaining
- extract-smart-kg-l1.ts (recommendations) to 3.0.
- CI on #2421.
