---
# folio-assistant-2egb
$schema: bean/1.0.0
title: 'PROV decision record cites Consent id + versionId (PCF8)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T16:44:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-a7c1
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: cat-harness, cat-harness-tools. Depends on: B4, PCF6.

## Done when
- [x] Every consent-based decision names its Consent.

## Progress
- 2026-10-30: Added `ProvConsentRefSchema` (`{ id, versionId }`, both required non-empty), `cat-harness:consent` and `cat-harness:consentBased`, `ProvConsentDecisionRecordSchema`, and `missing-consent` chain verification in `cat-harness/schemas/content/prov.ts` (plus PROV-JSONLD emission in `cat-harness/schemas/kg/prov-jsonld.ts` and unit tests in `cat-harness/schemas/content/prov.test.ts`), and wired Consent `id` + `versionId` citations and QA/QC verification in `cat-harness-tools` (`src/workflow/prov-record.ts`, `src/workflow/instance.ts`, `scripts/prov-qaqc.ts`, `scripts/tests/prov-record.test.ts`). Updated PRs `litlfred/cat-harness#753` (`https://github.com/litlfred/cat-harness/pull/753`) and `litlfred/cat-harness-tools#919` (`https://github.com/litlfred/cat-harness-tools/pull/919`).
- 2026-10-30 19:21Z: schema half landed in [cat-harness-tools#975](https://github.com/litlfred/cat-harness-tools/pull/975) (876295d, port of cat-harness#753, closed). Waits on [cat-harness-tools#919](https://github.com/litlfred/cat-harness-tools/pull/919) (prov-record, DSA thread). Follow-up to standard terms: folio-assistant-yy40.
