---
doc_id: ihe-iti-pcf-1-1-0
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Privacy Consent on FHIR (PCF)"
section_id: s005-actor-options-1-53-2
section_title: "Actor Options (§1:53.2)"
file: "ihe-iti-pcf-1-1-0.md"
lines: 32-41
source_sha256: c0b86193d6ac3abb
granularity: heading
---
### Actor Options (§1:53.2)

The **Consent Recorder** and **Consent Registry** support five explicit `[ITI-108]` Access Consent interaction options:

1. **Access Consent: Read** — Retrieve a specific `Consent` instance by logical ID (`GET [base]/Consent/[id]`) or version ID (`GET [base]/Consent/[id]/_history/[vid]`).
2. **Access Consent: Search** — Query `Consent` instances by `patient`, `status`, `date`, `period`, `actor`, `action`, `purpose`, `security-label`, `category`, or `source-reference`.
3. **Access Consent: Put** — Update an existing `Consent` directive (`PUT [base]/Consent/[id]`) and record a corresponding `Provenance` resource.
4. **Access Consent: Post** — Create a new `Consent` directive (`POST [base]/Consent`) and record a corresponding `Provenance` resource.
5. **Access Consent: Delete** — Remove or enter-in-error/revoke a `Consent` directive (`DELETE [base]/Consent/[id]` or status transition to `inactive`).
