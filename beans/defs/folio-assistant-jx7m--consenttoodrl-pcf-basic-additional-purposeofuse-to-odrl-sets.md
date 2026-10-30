---
# folio-assistant-jx7m
$schema: bean/1.0.0
title: 'consentToOdrl(): PCF Basic + Additional PurposeOfUse to ODRL Sets, plus four implicit-policy Sets (PCF5)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T16:26:45Z
parent: folio-assistant-negd
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: fhir-harness. Depends on: B1, B2.

## Done when
- [x] PCF's own example Consents translate and decide() gives permit/deny/unknown as PCF Volume 1 says.

## Progress
- 2026-10-30: Implemented `consentToOdrl()`, `decide()`, `evaluatePcfPolicy()`, `isConsentExpired()`, `consentPolicyUid()`, `extractConsentCitation()`, `detectPcfProfile()`, and the four IHE PCF 1.1.0 Volume 1 §1:53.2.1 implicit-policy ODRL `Set`s (`Policy-basic-normal`, `Policy-all-normal`, `Policy-break-glass-only`, `Policy-deny`) in `fhir-harness/schemas/pcf-consent.ts`, with unit tests covering all four implicit-policy `Set`s and all 23 IHE PCF 1.1.0 example `Consent` shapes in `fhir-harness/schemas/pcf-consent.test.ts`. Opened PR `litlfred/fhir-harness#207` (`https://github.com/litlfred/fhir-harness/pull/207`).
