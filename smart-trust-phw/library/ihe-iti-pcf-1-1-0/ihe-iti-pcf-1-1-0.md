# IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF)

## Overview and Bibliographic Identity

The **IHE IT Infrastructure Technical Framework Supplement: Privacy Consent on FHIR (PCF)** specifies how patient privacy consent directives are recorded, discovered, maintained, and enforced over HL7 FHIR resources using the FHIR `Consent` resource and RESTful transactions.

| Field | Value |
|---|---|
| **Title** | IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF) |
| **Canonical URL** | `https://profiles.ihe.net/ITI/PCF` |
| **Versioned Specification URL** | `https://profiles.ihe.net/ITI/PCF/1.1.0/` |
| **ImplementationGuide Resource** | `https://profiles.ihe.net/ITI/PCF/ImplementationGuide/ihe.iti.pcf` |
| **Version** | `1.1.0` (Trial Implementation, published `2023-08-04`; FHIR NPM package `ihe.iti.pcf@1.1.0` built `2024-02-23`) |
| **FHIR Version** | `4.0.1` |
| **Publisher** | IHE IT Infrastructure Technical Committee (`iti@ihe.net`), Integrating the Healthcare Enterprise (IHE) |
| **License** | Creative Commons Attribution 4.0 International (`CC-BY-4.0`, `https://creativecommons.org/licenses/by/4.0/`) |

## Volume 1 — Profiles: Privacy Consent on FHIR (PCF) (§1:53)

### Actors and Transactions (§1:53.1)

PCF defines three primary actors for privacy consent management and enforcement:

| Actor | Role in PCF | CapabilityStatement Canonical |
|---|---|---|
| **Consent Recorder** | Captures, updates, and revokes patient privacy consent directives on behalf of a patient or authorized representative and submits them to a Consent Registry via `[ITI-108]` Access Consent. | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentRecorder` |
| **Consent Registry** | Stores, indexes, versions, and serves FHIR `Consent` resources (and associated `Provenance` records) in response to `[ITI-108]` Access Consent requests. | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentRegistry` |
| **Consent Authorization Server** | Evaluates applicable active `Consent` directives retrieved from the Consent Registry via `[ITI-108]` to render access control decisions (`permit` or `deny`) on health data access requests. | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentAuthorizationServer` |

The core transaction for recording, updating, revoking, reading, and searching consent directives is **Access Consent `[ITI-108]`** between the **Consent Recorder** (or **Consent Authorization Server**) and the **Consent Registry**.

### Actor Options (§1:53.2)

The **Consent Recorder** and **Consent Registry** support five explicit `[ITI-108]` Access Consent interaction options:

1. **Access Consent: Read** — Retrieve a specific `Consent` instance by logical ID (`GET [base]/Consent/[id]`) or version ID (`GET [base]/Consent/[id]/_history/[vid]`).
2. **Access Consent: Search** — Query `Consent` instances by `patient`, `status`, `date`, `period`, `actor`, `action`, `purpose`, `security-label`, `category`, or `source-reference`.
3. **Access Consent: Put** — Update an existing `Consent` directive (`PUT [base]/Consent/[id]`) and record a corresponding `Provenance` resource.
4. **Access Consent: Post** — Create a new `Consent` directive (`POST [base]/Consent`) and record a corresponding `Provenance` resource.
5. **Access Consent: Delete** — Remove or enter-in-error/revoke a `Consent` directive (`DELETE [base]/Consent/[id]` or status transition to `inactive`).

### Implicit Base Policy Sets (§1:53.2.1)

A FHIR `Consent` resource under PCF refines an underlying organizational or jurisdictional privacy policy identified in `Consent.policy.uri`. PCF organizes consent expressiveness into four progressive profile levels corresponding to the implicit base policy set (`Consent.provision.type`):

| Profile Level | StructureDefinition Canonical | Semantics |
|---|---|---|
| **Basic Consent** | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentBasic` | Explicit opt-in (`provision.type = permit` against a deny-by-default base policy) or opt-out (`provision.type = deny` against a permit-by-default base policy) covering the patient's health data as a whole, optionally bounded by `Consent.provision.period` and `Consent.provision.purpose`. |
| **Intermediate Consent** | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentIntermediate` | Adds one level of nested `Consent.provision.provision` exceptions or inclusions scoped by **purpose of use** (`purpose`), **authorized actor / practitioner / organization** (`actor`), **timeframe** (`period`, `dataPeriod`), **clinical document / resource instance** (`data`, `class`, `code`), or **confidentiality / sensitivity security labels** (`securityLabel`). |
| **Advanced Consent** | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentAdvanced` | Permits recursive trees of `Consent.provision.provision` rules combining positive (`permit`) and negative (`deny`) sub-provisions across any combination of actors, purposes, security labels, clinical codes, and data references. |

## Volume 2 — Transactions: Access Consent [ITI-108] (§2:3.108)

### Scope and Interaction Model

Transaction **Access Consent `[ITI-108]`** is used by a **Consent Recorder** to create, update, delete, read, or search `Consent` resources held on a **Consent Registry**, and by a **Consent Authorization Server** (or composite data-sharing actor such as a VHL Sharer) to query active `Consent` directives for a patient prior to disclosing health information.

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

## Volume 3 — Content Profiles and Terminology (§3:5.8)

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

### Conformance Artefact Inventory in `ihe.iti.pcf@1.1.0`

| ResourceType | ID | Name / Title | Canonical URL |
|---|---|---|---|
| `ImplementationGuide` | `ihe.iti.pcf` | Privacy Consent on FHIR (PCF) | `https://profiles.ihe.net/ITI/PCF/ImplementationGuide/ihe.iti.pcf` |
| `CapabilityStatement` | `IHE.PCF.consentRecorder` | IHE PCF Consent Recorder | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentRecorder` |
| `CapabilityStatement` | `IHE.PCF.consentRegistry` | IHE PCF Consent Registry | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentRegistry` |
| `CapabilityStatement` | `IHE.PCF.consentAuthorizationServer` | IHE PCF Consent Authorization Server | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentAuthorizationServer` |
| `StructureDefinition` | `IHE.PCF.consentBasic` | IHE PCF Basic Consent | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentBasic` |
| `StructureDefinition` | `IHE.PCF.consentIntermediate` | IHE PCF Intermediate Consent | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentIntermediate` |
| `StructureDefinition` | `IHE.PCF.consentAdvanced` | IHE PCF Advanced Consent | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.consentAdvanced` |
| `StructureDefinition` | `IHE.PCF.provenance` | IHE PCF Consent Provenance | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/IHE.PCF.provenance` |
| `StructureDefinition` | `StickToPatient` | Stick To Patient Extension | `https://profiles.ihe.net/ITI/PCF/StructureDefinition/StickToPatient` |
| `ValueSet` | `PCFPurposeOfUseVS` | PCF Purpose Of Use ValueSet | `https://profiles.ihe.net/ITI/PCF/ValueSet/PCFPurposeOfUseVS` |
| `ValueSet` | `SlsSensitiveETHUD` | Substance Use Sensitivity ValueSet | `https://profiles.ihe.net/ITI/PCF/ValueSet/SlsSensitiveETHUD` |
| `ValueSet` | `SlsSensitiveKBHUD` | Behavioral Health Sensitivity ValueSet | `https://profiles.ihe.net/ITI/PCF/ValueSet/SlsSensitiveKBHUD` |
| `ValueSet` | `SlsSensitiveNYPBH` | Pediatric Behavioral Health Sensitivity ValueSet | `https://profiles.ihe.net/ITI/PCF/ValueSet/SlsSensitiveNYPBH` |
| `ValueSet` | `SlsSensitiveOPIOIDUD` | Opioid Use Disorder Sensitivity ValueSet | `https://profiles.ihe.net/ITI/PCF/ValueSet/SlsSensitiveOPIOIDUD` |
| `ValueSet` | `SlsSensitivePSY` | Psychiatry Sensitivity ValueSet | `https://profiles.ihe.net/ITI/PCF/ValueSet/SlsSensitivePSY` |
