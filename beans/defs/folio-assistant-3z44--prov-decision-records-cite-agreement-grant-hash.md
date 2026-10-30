---
# folio-assistant-3z44
$schema: bean/1.0.0
title: 'PROV decision records cite agreement + grant; hash-chained log (DSA B4)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-10-30T16:00:00Z
parent: folio-assistant-negd
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

`prov.ts` / `prov-record.ts` already record runs with `underPolicy`; add agreement URL + digest (and grant id once B5 exists), and a hash chain. Depends on B3.

## Done when
- [x] Editing or removing any past record fails the chain check.
- [x] Every decision record names its agreement and hash.

## Progress
- 2026-10-30: Added `ProvAgreementRefSchema` (`{ url, sha256, grant? }`), `ProvDecisionRecordSchema`, canonical record hashing (`canonicalProvRecord`, `computeProvRecordHash`), chain builders (`stampProvRecord`, `stampProvDecisionRecord`, `buildProvHashChain`, `appendProvDecisionRecord`), and `verifyProvHashChain` in `cat-harness/schemas/content/prov.ts` (plus PROV-JSONLD emission in `cat-harness/schemas/kg/prov-jsonld.ts`), and wired agreement/grant citations and automatic hash-chaining across workflow steps and QA/QC verification in `cat-harness-tools` (`src/workflow/prov-record.ts`, `src/workflow/instance.ts`, `scripts/prov-qaqc.ts`, `scripts/tests/prov-record.test.ts`). Opened PRs `litlfred/cat-harness#753` (`https://github.com/litlfred/cat-harness/pull/753`) and `litlfred/cat-harness-tools#919` (`https://github.com/litlfred/cat-harness-tools/pull/919`).
