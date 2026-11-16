---
doc_id: ihe-iti-pcf-1-1-0
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF)"
section_id: s011-required-elements-on-pcf-consent-profiles
section_title: "Required Elements on PCF Consent Profiles"
file: "ihe-iti-pcf-1-1-0.md"
lines: 77-98
source_sha256: c0b86193d6ac3abb
granularity: heading
---
### Required Elements on PCF Consent Profiles

Every PCF `Consent` instance (`IHE.PCF.consentBasic`, `IHE.PCF.consentIntermediate`, `IHE.PCF.consentAdvanced`) constrains the FHIR `Consent` resource as follows:

- `Consent.status` (`1..1`): `draft | active | inactive | entered-in-error` (`proposed` and `rejected` are prohibited in active enforcement).
- `Consent.scope` (`1..1`): Fixed to `http://terminology.hl7.org/CodeSystem/consentscope#patient-privacy`.
- `Consent.category` (`1..*`): Includes `http://loinc.org#59284-0` (*Consent Document*).
- `Consent.patient` (`1..1`): Reference to the `Patient` whose health information is governed by the directive.
- `Consent.dateTime` (`0..1` / `1..1`): Timestamp when the consent was agreed or recorded.
- `Consent.performer` (`0..*`): The party (patient or representative) granting or recording the consent.
- `Consent.organization` (`0..*`) and `Consent.source[x]` (`0..1`): Custodial organization and signed source artifact or questionnaire response.
- `Consent.policy` (`1..*`): `Consent.policy.uri` identifying the base privacy policy under which the directive operates.
- `Consent.provision` (`0..1`):
  - `provision.type`: `permit` or `deny`
  - `provision.period`: Validity window (`start`, `end`) of the consent directive
  - `provision.actor`: `role` (`ParticipationRoleType`) and `reference` (`Practitioner`, `Organization`, `Patient`, `RelatedPerson`, `Device`)
  - `provision.action`: Permitted or denied actions (`access`, `collect`, `use`, `disclose`)
  - `provision.securityLabel`: Security labels from HL7 Healthcare Privacy and Security Classification System (HCS)
  - `provision.purpose`: Purpose of Use coding from `PCFPurposeOfUseVS` (`TREAT`, `ETREAT`, `HPAYMT`, `HOPERAT`, `HRESCH`, `PUBHLTH`, `PATRQT`, `FAMRQT`, `PWATRNY`, `SUPNWK`)
  - `provision.dataPeriod`: Clinical timeframe of records covered
  - `provision.data`: Explicit `meaning` (`instance | related | dependents | authoredby`) and `reference` to covered FHIR resources
