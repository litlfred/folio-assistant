---
doc_id: ihe-iti-vhl-1-0-0-comment
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL)"
section_id: s004-actors-and-responsibilities
section_title: "Actors and Responsibilities"
file: "ihe-iti-vhl-1-0-0-comment.md"
lines: 20-30
source_sha256: e2775b089a9763ff
granularity: heading
---
### Actors and Responsibilities

VHL defines four core actors that participate in the issuance and redemption of a Verifiable Health Link:

| Actor | ActorDefinition Canonical | Role in VHL |
|---|---|---|
| **VHL Holder** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLHolder` | Individual (or personal health wallet application acting on the individual's behalf) that requests generation of a VHL from a VHL Sharer (`[ITI-YY3]`) and presents the VHL to a VHL Receiver (`[ITI-YY4]`). |
| **VHL Sharer** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLSharer` | System that publishes its PKI signing material to a Trust Anchor (`[ITI-YY1]`), generates signed VHL payloads for a VHL Holder (`[ITI-YY3]`), and serves the manifest and referenced clinical documents to an authorized VHL Receiver (`[ITI-YY5]`). |
| **VHL Receiver** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLReceiver` | System that receives a VHL from a VHL Holder (`[ITI-YY4]`), verifies cryptographic trust material against a Trust Anchor's trust list (`[ITI-YY2]`), and retrieves the health document manifest and clinical documents from the VHL Sharer (`[ITI-YY5]`). |
| **Trust Anchor** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/TrustAnchor` | Governance and PKI distribution actor that receives participant public key material (`[ITI-YY1]`) and distributes signed trust lists (such as DID documents or X.509/JWKS trust lists) to VHL Participants (`[ITI-YY2]`). |
