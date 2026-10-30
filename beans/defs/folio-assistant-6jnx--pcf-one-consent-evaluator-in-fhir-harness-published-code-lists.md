---
# folio-assistant-6jnx
$schema: bean/1.0.0
title: 'PCF follow-up: one Consent evaluator in fhir-harness; read PurposeOfUse and Consent from published packages'
status: todo
type: task
priority: normal
created_at: 2026-10-30T16:55:00Z
updated_at: 2026-10-30T16:55:00Z
parent: folio-assistant-negd
---

Owner card 2026-10-30 16:47Z, thread "Drain PCF beans": "A. Merge mine now, fix after". [fhir-harness#207](https://github.com/litlfred/fhir-harness/pull/207), [#208](https://github.com/litlfred/fhir-harness/pull/208), [#209](https://github.com/litlfred/fhir-harness/pull/209) and [smart-trust-phw#3](https://github.com/litlfred/smart-trust-phw/pull/3) merged; this bean fixes the two root-cause problems review found. Issue: [folio-assistant#2702](https://github.com/litlfred/folio-assistant/issues/2702). Suited to agy: it needs packages.fhir.org, which cloud sessions cannot reach.

Repo: cat-harness, fhir-harness.

## Problem 1: wrong layer, written twice
[cat-harness#742](https://github.com/litlfred/cat-harness/pull/742) commit 55f5955 (a7c1) adds `FhirConsentLike`, `PcfConsentPolicy`, `pcf:*` scope keys and `evaluatePcfConsent()` to `cat-harness/schemas/content/odrl.ts`. The same decision logic is `decide()` / `consentToOdrl()` in [fhir-harness `schemas/pcf-consent.ts`](https://github.com/litlfred/fhir-harness/blob/main/schemas/pcf-consent.ts). [cat-harness AGENTS.md](https://github.com/litlfred/cat-harness/blob/main/AGENTS.md): content vocabulary belongs in the layer above. Fix: cat-harness's `odrl:obtainConsent` duty takes a plain consent verdict (`permit` | `deny` | `unknown`, plus the citation for 2egb) from an injected evaluator; only fhir-harness parses FHIR Consents.

## Problem 2: hand copies of published standards
`HL7_PURPOSE_OF_USE` in fhir-harness `schemas/pcf-consent.ts` (and the PurposeOfUse handling in cat-harness#742) hand-types the [HL7 v3-ActReason](http://terminology.hl7.org/CodeSystem/v3-ActReason) hierarchy; some parent links look doubtful (CLINTRL, POPHLTH under TREAT). `FhirConsent` types in `pcf-consent.ts` and the zod shapes in [`iti-108-consent-client.ts`](https://github.com/litlfred/fhir-harness/blob/main/schemas/iti-108-consent-client.ts) hand-write R4 Consent/Bundle. Fix: read the hierarchy from the pinned `hl7.terminology` package and the Consent shape from `hl7.fhir.r4.core`; `isConsentExpired` exists in both fhir-harness files, keep one.

## Done when
- [ ] cat-harness `schemas/content/odrl.ts` names no FHIR resource and no `pcf:` key; a7c1's three cases still pass via the injected evaluator.
- [ ] fhir-harness has one PCF Consent evaluator; no hand-typed PurposeOfUse hierarchy or Consent type remains.
- [ ] The published `ihe.iti.pcf#1.1.0` example sweep in `pcf-consent.test.ts` runs (not skipped) in CI.
