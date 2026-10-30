---
# folio-assistant-3z44
$schema: bean/1.0.0
title: 'PROV decision records cite agreement + grant; hash-chained log (DSA B4)'
status: todo
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T14:05:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

`prov.ts` / `prov-record.ts` already record runs with `underPolicy`; add agreement URL + digest (and grant id once B5 exists), and a hash chain. Depends on B3.

## Done when
- Editing or removing any past record fails the chain check.
- Every decision record names its agreement and hash.
