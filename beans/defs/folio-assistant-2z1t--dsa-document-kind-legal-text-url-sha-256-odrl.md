---
# folio-assistant-2z1t
$schema: bean/1.0.0
title: 'dsa document kind: legal text URL + SHA-256, ODRL Agreement, DCAT record, hash check (DSA B3)'
status: todo
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T14:05:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

In `folio-assistant-core` (content vocabulary). Versioned: a new version gets a new hash. One worked example (fictional unless the owner names a real public DSA, open question (i)). Depends on B1.

## Done when
- The check passes on the example and fails on a one-byte change to the legal text.
- The Agreement must cite the same URL + hash as the record.
