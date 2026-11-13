---
doc_id: ihe-iti-pcf-1-1-0
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF)"
section_id: s006-implicit-base-policy-sets-1-53-2-1
section_title: "Implicit Base Policy Sets (§1:53.2.1)"
file: "ihe-iti-pcf-1-1-0.md"
lines: 42-51
source_sha256: c0b86193d6ac3abb
granularity: heading
---
### Implicit Base Policy Sets (§1:53.2.1)

A FHIR `Consent` resource under PCF refines an underlying organizational or jurisdictional privacy policy identified in `Consent.policy.uri`. PCF organizes consent expressiveness into four progressive profile levels corresponding to the implicit base policy set (`Consent.provision.type`):

| Profile Level | StructureDefinition Canonical | Semantics |
|---|---|---|
| **Basic Consent** | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentBasic` | Explicit opt-in (`provision.type = permit` against a deny-by-default base policy) or opt-out (`provision.type = deny` against a permit-by-default base policy) covering the patient's health data as a whole, optionally bounded by `Consent.provision.period` and `Consent.provision.purpose`. |
| **Intermediate Consent** | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentIntermediate` | Adds one level of nested `Consent.provision.provision` exceptions or inclusions scoped by **purpose of use** (`purpose`), **authorized actor / practitioner / organization** (`actor`), **timeframe** (`period`, `dataPeriod`), **clinical document / resource instance** (`data`, `class`, `code`), or **confidentiality / sensitivity security labels** (`securityLabel`). |
| **Advanced Consent** | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentAdvanced` | Permits recursive trees of `Consent.provision.provision` rules combining positive (`permit`) and negative (`deny`) sub-provisions across any combination of actors, purposes, security labels, clinical codes, and data references. |
