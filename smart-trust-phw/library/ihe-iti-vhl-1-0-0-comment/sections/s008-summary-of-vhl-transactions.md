---
doc_id: ihe-iti-vhl-1-0-0-comment
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL)"
section_id: s008-summary-of-vhl-transactions
section_title: "Summary of VHL Transactions"
file: "ihe-iti-vhl-1-0-0-comment.md"
lines: 44-53
source_sha256: e2775b089a9763ff
granularity: heading
---
### Summary of VHL Transactions

| Transaction Code | Transaction Name | Initiator | Responder | Description |
|---|---|---|---|---|
| **`[ITI-YY1]`** | **Submit PKI Material with DID** | VHL Sharer / VHL Receiver | Trust Anchor | Submits public key material (DID document / JWK Set / X.509 certificate metadata) to the Trust Anchor for inclusion in the trust network's published key list. |
| **`[ITI-YY2]`** | **Retrieve Trust List with DID** | VHL Receiver / VHL Sharer | Trust Anchor | Retrieves the signed trust list (DID document / JWK Set) from the Trust Anchor to verify signatures on VHL payloads (`[ITI-YY4]`) and mutual TLS / client authentication (`[ITI-YY5]`). |
| **`[ITI-YY3]`** | **Generate VHL** | VHL Holder | VHL Sharer | Requests generation of a Verifiable Health Link (`$generate-vhl`, `OperationDefinition/GenerateVHL`), optionally bound to a PCF `Consent` directive (`[ITI-108]`) and selective disclosure parameters, returning the signed VHL payload (e.g., HCERT / CWT / SMART Health Link URI). |
| **`[ITI-YY4]`** | **Provide VHL** | VHL Holder | VHL Receiver | Transfers the VHL payload from the VHL Holder's wallet (via QR code scan, deep link, or near-field exchange) to the VHL Receiver, which verifies the VHL signature using keys obtained via `[ITI-YY2]`. |
| **`[ITI-YY5]`** | **Retrieve Manifest** | VHL Receiver | VHL Sharer | Submits the verified VHL authorization token and context (including `purpose` of use and requester identity) to the VHL Sharer's manifest endpoint (`POST [base]/manifest` or equivalent) to obtain the `Bundle` of `DocumentReference` entries and retrieve the authorized clinical documents. |
