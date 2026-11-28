---
doc_id: ihe-iti-pcf-1-1-0
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF)"
section_id: s009-message-semantics-2-3-108-4
section_title: "Message Semantics (§2:3.108.4)"
file: "ihe-iti-pcf-1-1-0.md"
lines: 58-74
source_sha256: c0b86193d6ac3abb
granularity: heading
---
### Message Semantics (§2:3.108.4)

`[ITI-108]` uses the HL7 FHIR RESTful API over HTTPS:

- **Create (`POST [base]/Consent`)**: Creates a new `Consent` resource conforming to `IHE.PCF.consentBasic`, `IHE.PCF.consentIntermediate`, or `IHE.PCF.consentAdvanced`. When submitted inside a FHIR `transaction` Bundle alongside a `Provenance` resource (`IHE.PCF.provenance`), records who captured the consent directive and how it was attested.
- **Update (`PUT [base]/Consent/[id]`)**: Replaces an existing `Consent` directive (for example, changing `Consent.status` from `active` to `inactive` upon revocation, or amending `Consent.provision` rules), incrementing `Consent.meta.versionId`.
- **Delete (`DELETE [base]/Consent/[id]`)**: Logically deletes a `Consent` resource recorded in error.
- **Read / VRead (`GET [base]/Consent/[id]`, `GET [base]/Consent/[id]/_history/[vid]`)**: Fetches the current or version-specific snapshot of a `Consent` resource so an authorization decision can cite the exact `Consent.id` and `Consent.meta.versionId`.
- **Search (`GET [base]/Consent?...`)**: Queries matching consent directives by:
  - `patient` (Reference to `Patient`)
  - `status` (`active`, `inactive`, `draft`, `entered-in-error`)
  - `purpose` (token from `http://terminology.hl7.org/ValueSet/v3-PurposeOfUse` / `https://profiles.ihe.net/ITI/PCF/ValueSet/PCFPurposeOfUseVS`)
  - `actor` (Reference to `Practitioner`, `Organization`, `Patient`, `RelatedPerson`, or `Device`)
  - `period` and `date`
  - `security-label` (confidentiality and sensitivity codes)
  - `data` (Reference to specific clinical resources such as `DocumentReference`, `Immunization`, `Composition`, or `Bundle`)
