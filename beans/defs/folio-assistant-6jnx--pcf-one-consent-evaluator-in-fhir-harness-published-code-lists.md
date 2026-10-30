---
# folio-assistant-6jnx
$schema: bean/1.0.0
title: 'PCF follow-up: one Consent evaluator in fhir-harness; read PurposeOfUse and Consent from published packages'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T16:55:00Z
updated_at: 2026-10-30T17:56:00Z
parent: folio-assistant-negd
---

Owner card 2026-10-30 16:47Z, thread "Drain PCF beans": "A. Merge mine now, fix after". [fhir-harness#207](https://github.com/litlfred/fhir-harness/pull/207), [#208](https://github.com/litlfred/fhir-harness/pull/208), [#209](https://github.com/litlfred/fhir-harness/pull/209) and [smart-trust-phw#3](https://github.com/litlfred/smart-trust-phw/pull/3) merged; this bean fixes the two root-cause problems review found. Issue: [folio-assistant#2702](https://github.com/litlfred/folio-assistant/issues/2702). Suited to agy: it needs packages.fhir.org, which cloud sessions cannot reach.

Repo: cat-harness, fhir-harness.

## Problem 1: wrong layer, written twice
[cat-harness#742](https://github.com/litlfred/cat-harness/pull/742) commit 55f5955 (a7c1) adds `FhirConsentLike`, `PcfConsentPolicy`, `pcf:*` scope keys and `evaluatePcfConsent()` to `cat-harness/schemas/content/odrl.ts`. The same decision logic is `decide()` / `consentToOdrl()` in [fhir-harness `schemas/pcf-consent.ts`](https://github.com/litlfred/fhir-harness/blob/main/schemas/pcf-consent.ts). [cat-harness AGENTS.md](https://github.com/litlfred/cat-harness/blob/main/AGENTS.md): content vocabulary belongs in the layer above. Fix: cat-harness's `odrl:obtainConsent` duty takes a plain consent verdict (`permit` | `deny` | `unknown`, plus the citation for 2egb) from an injected evaluator; only fhir-harness parses FHIR Consents.

## Problem 2: hand copies of published standards
`HL7_PURPOSE_OF_USE` in fhir-harness `schemas/pcf-consent.ts` (and the PurposeOfUse handling in cat-harness#742) hand-types the [HL7 v3-ActReason](http://terminology.hl7.org/CodeSystem/v3-ActReason) hierarchy; some parent links look doubtful (CLINTRL, POPHLTH under TREAT). `FhirConsent` types in `pcf-consent.ts` and the zod shapes in [`iti-108-consent-client.ts`](https://github.com/litlfred/fhir-harness/blob/main/schemas/iti-108-consent-client.ts) hand-write R4 Consent/Bundle. Fix: read the hierarchy from the pinned `hl7.terminology` package and the Consent shape from `hl7.fhir.r4.core`; `isConsentExpired` exists in both fhir-harness files, keep one.

## Done when
- [x] cat-harness `schemas/content/odrl.ts` names no FHIR resource and no `pcf:` key; a7c1's three cases still pass via the injected evaluator.
- [x] fhir-harness has one PCF Consent evaluator; no hand-typed PurposeOfUse hierarchy or Consent type remains.
- [x] The published `ihe.iti.pcf#1.1.0` example sweep in `pcf-consent.test.ts` runs (not skipped) in CI.

_2026-10-30T17:13:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`) to implement items 1–5 across `cat-harness` and `fhir-harness`.

_2026-10-30T17:56:00Z_ — Implemented across [litlfred/cat-harness#781](https://github.com/litlfred/cat-harness/pull/781) (`fix/6jnx-injected-consent-evaluator`, `c3dc69b1`) and [litlfred/fhir-harness#222](https://github.com/litlfred/fhir-harness/pull/222) (`fix/6jnx-published-packages-one-evaluator`, `adc61a2`):
- **Problem 1 (one PCF Consent evaluator in `fhir-harness`, injected into `cat-harness`):** Removed `FhirConsentLike`, `PcfConsentPolicy`, `PcfConsentStatus`, `pcf:*` scope operands, `convertFhirConsentToSet`, `evaluateSingleConsentSet`, and `evaluatePcfConsent` from `cat-harness/schemas/content/odrl.ts`. `odrl:obtainConsent` duty evaluation now calls an injected `ConsentEvaluator` (`req.consentEvaluator` / `req.consentVerdict`) returning `{ verdict: "permit" | "deny" | "unknown", consent?: { id, versionId, uid } }`, with `permitsWithConsent()` and `decideWithConsent()` surfacing the citation for `2egb`. `fhir-harness/schemas/pcf-consent.ts` exports `decideWithCitation()` and `createPcfConsentEvaluator(consents, options)`.
- **Problem 2 (published packages, no hand-typed `PurposeOfUse` or `Consent` shapes, one `isConsentExpired`):**
  - `HL7_PURPOSE_OF_USE` is loaded at runtime from `hl7.terminology.r4#5.3.0/package/CodeSystem-v3-ActReason.json` (60 `PurposeOfUse` concepts via `subsumedBy`). Verified in `CodeSystem-v3-ActReason.json`: `CLINTRL` (*"To perform health care as part of the clinical trial protocol"*) and `POPHLTH` (*"provision of health care to a population of living subjects"*), as well as `COC` (*"coordination of care"*, previously missing), DO carry `subsumedBy: "TREAT"`; whereas the hand-typed map had `CAREMGT` under `["HOPERAT", "TREAT"]` when `v3-ActReason` gives it `subsumedBy: ["HOPERAT"]` only (explicitly excluding treatment), had `HTEST` directly under `HOPERAT` instead of `subsumedBy: ["SYSDEV"]` (`-> HOPERAT`), had `LABELING` and `METAMGT` directly under `HOPERAT` instead of `subsumedBy: ["HSYSADMIN"]` (`-> HOPERAT`), and included non-existent code `HAAUTH`.
  - `FhirConsentSchema`, `FhirStrictConsentSchema`, `FhirSearchsetBundleSchema`, `FhirOperationOutcomeSchema`, and required code lists (`consent-state-codes`, `consent-provision-type`, `consent-data-meaning`, `search-entry-mode`, `issue-severity`, `issue-type`) are built at runtime from `hl7.fhir.r4.core#4.0.1` `StructureDefinition-{Consent,Bundle,OperationOutcome}.json` and `CodeSystem-*.json`. All hand-written `interface FhirConsent*` declarations and hand-written `Consent`/`Bundle` Zod object shapes are removed.
  - `isConsentExpired` and `parseFhirPeriodBound` exist once in `fhir-harness/schemas/pcf-consent.ts` and are imported/re-exported by `schemas/iti-108-consent-client.ts`.
  - Unmodified published package files from `hl7.terminology.r4#5.3.0`, `hl7.fhir.r4.core#4.0.1`, and all 23 `ihe.iti.pcf#1.1.0/example/Consent-*.json` examples are committed under `fhir-harness/test/support/pcf/` (with sha256 manifest `test/support/pcf/provenance.json`, plus `cat-harness/test/fixtures/hl7.terminology.r4#5.3.0/`); `describe.skipIf` is removed from `schemas/pcf-consent.test.ts` so the 23-example sweep runs unskipped in CI (30 pass, 0 skip, 0 fail).
