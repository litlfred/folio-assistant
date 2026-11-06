---
doc_id: ihe-iti-vhl-1-0-0-comment
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL)"
section_id: s006-composite-grouping-with-ihe-pcf-privacy-consent-
section_title: "Composite Grouping with IHE PCF (Privacy Consent on FHIR)"
file: "ihe-iti-vhl-1-0-0-comment.md"
lines: 35-41
source_sha256: e2775b089a9763ff
granularity: heading
---
### Composite Grouping with IHE PCF (Privacy Consent on FHIR)

When a **VHL Sharer** is grouped with IHE PCF actors (**Consent Recorder**, **Consent Registry**, and/or **Consent Authorization Server**):

1. Before or during VHL issuance (`[ITI-YY3]`), the VHL Holder records or selects a patient privacy consent directive stored via **PCF Access Consent `[ITI-108]`**, scoping which documents, purposes of use, recipients, or validity periods the VHL covers.
2. When a **VHL Receiver** redeems the VHL via **Retrieve Manifest `[ITI-YY5]`**, the **VHL Sharer** evaluates the active PCF `Consent` directive(s) retrieved via `[ITI-108]` against the redemption context (requester identity, purpose of use, document references, and timestamp) before returning the manifest or clinical documents.
