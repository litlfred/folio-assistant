---
doc_id: ihe-iti-pcf-1-1-0
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF)"
section_id: s004-actors-and-transactions-1-53-1
section_title: "Actors and Transactions (§1:53.1)"
file: "ihe-iti-pcf-1-1-0.md"
lines: 20-31
source_sha256: c0b86193d6ac3abb
granularity: heading
---
### Actors and Transactions (§1:53.1)

PCF defines three primary actors for privacy consent management and enforcement:

| Actor | Role in PCF | CapabilityStatement Canonical |
|---|---|---|
| **Consent Recorder** | Captures, updates, and revokes patient privacy consent directives on behalf of a patient or authorized representative and submits them to a Consent Registry via `[ITI-108]` Access Consent. | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentRecorder` |
| **Consent Registry** | Stores, indexes, versions, and serves FHIR `Consent` resources (and associated `Provenance` records) in response to `[ITI-108]` Access Consent requests. | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentRegistry` |
| **Consent Authorization Server** | Evaluates applicable active `Consent` directives retrieved from the Consent Registry via `[ITI-108]` to render access control decisions (`permit` or `deny`) on health data access requests. | `https://profiles.ihe.net/ITI/PCF/CapabilityStatement/IHE.PCF.consentAuthorizationServer` |

The core transaction for recording, updating, revoking, reading, and searching consent directives is **Access Consent `[ITI-108]`** between the **Consent Recorder** (or **Consent Authorization Server**) and the **Consent Registry**.
