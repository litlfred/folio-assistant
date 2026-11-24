# IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL)

## Overview and Bibliographic Identity

The **IHE IT Infrastructure Technical Framework Supplement: Verifiable Health Links (VHL)** specifies actors, transactions, and trust-list interactions for issuing, presenting, verifying, and redeeming cryptographically verifiable links to health documents and FHIR resources across organizational and jurisdictional boundaries.

| Field | Value |
|---|---|
| **Title** | IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL) |
| **Canonical URL** | `https://profiles.ihe.net/ITI/VHL` |
| **Versioned Specification URL** | `https://profiles.ihe.net/ITI/VHL/1.0.0-comment/` |
| **ImplementationGuide Resource** | `https://profiles.ihe.net/ITI/VHL/ImplementationGuide/ihe.iti.vhl` |
| **Version** | `1.0.0-comment` (Public Comment / Trial Implementation; FHIR NPM package `ihe.iti.vhl@1.0.0-comment` built `2026-06-14`) |
| **FHIR Version** | `4.0.1` |
| **Publisher** | IHE IT Infrastructure Technical Committee (`iti@ihe.net`), Integrating the Healthcare Enterprise (IHE) |
| **License** | Creative Commons Attribution 4.0 International (`CC-BY-4.0`, `https://creativecommons.org/licenses/by/4.0/`) |

## Volume 1 — Verifiable Health Links (VHL) Actors, Transactions, and Trust-Anchor Neutrality

### Actors and Responsibilities

VHL defines four core actors that participate in the issuance and redemption of a Verifiable Health Link:

| Actor | ActorDefinition Canonical | Role in VHL |
|---|---|---|
| **VHL Holder** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLHolder` | Individual (or personal health wallet application acting on the individual's behalf) that requests generation of a VHL from a VHL Sharer (`[ITI-YY3]`) and presents the VHL to a VHL Receiver (`[ITI-YY4]`). |
| **VHL Sharer** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLSharer` | System that publishes its PKI signing material to a Trust Anchor (`[ITI-YY1]`), generates signed VHL payloads for a VHL Holder (`[ITI-YY3]`), and serves the manifest and referenced clinical documents to an authorized VHL Receiver (`[ITI-YY5]`). |
| **VHL Receiver** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLReceiver` | System that receives a VHL from a VHL Holder (`[ITI-YY4]`), verifies cryptographic trust material against a Trust Anchor's trust list (`[ITI-YY2]`), and retrieves the health document manifest and clinical documents from the VHL Sharer (`[ITI-YY5]`). |
| **Trust Anchor** | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/TrustAnchor` | Governance and PKI distribution actor that receives participant public key material (`[ITI-YY1]`) and distributes signed trust lists (such as DID documents or X.509/JWKS trust lists) to VHL Participants (`[ITI-YY2]`). |

### Trust-Anchor Neutrality

IHE VHL is **trust-anchor neutral** by design. The **Trust Anchor** actor represents any trust framework authority capable of accepting PKI material (`[ITI-YY1]`) and distributing verifiable trust lists (`[ITI-YY2]`). The **WHO Global Digital Health Certification Network (GDHCN)** is one possible Trust Anchor implementation among others (such as national health PKI roots, regional cross-border trust networks, or bilateral federation anchors). No VHL transaction hardcodes a single trust network host; participants resolve issuer and receiver keys through the configured Trust Anchor's `[ITI-YY2]` trust list.

### Composite Grouping with IHE PCF (Privacy Consent on FHIR)

When a **VHL Sharer** is grouped with IHE PCF actors (**Consent Recorder**, **Consent Registry**, and/or **Consent Authorization Server**):

1. Before or during VHL issuance (`[ITI-YY3]`), the VHL Holder records or selects a patient privacy consent directive stored via **PCF Access Consent `[ITI-108]`**, scoping which documents, purposes of use, recipients, or validity periods the VHL covers.
2. When a **VHL Receiver** redeems the VHL via **Retrieve Manifest `[ITI-YY5]`**, the **VHL Sharer** evaluates the active PCF `Consent` directive(s) retrieved via `[ITI-108]` against the redemption context (requester identity, purpose of use, document references, and timestamp) before returning the manifest or clinical documents.

## Volume 2 — VHL Transactions ([ITI-YY1] through [ITI-YY5])

### Summary of VHL Transactions

| Transaction Code | Transaction Name | Initiator | Responder | Description |
|---|---|---|---|---|
| **`[ITI-YY1]`** | **Submit PKI Material with DID** | VHL Sharer / VHL Receiver | Trust Anchor | Submits public key material (DID document / JWK Set / X.509 certificate metadata) to the Trust Anchor for inclusion in the trust network's published key list. |
| **`[ITI-YY2]`** | **Retrieve Trust List with DID** | VHL Receiver / VHL Sharer | Trust Anchor | Retrieves the signed trust list (DID document / JWK Set) from the Trust Anchor to verify signatures on VHL payloads (`[ITI-YY4]`) and mutual TLS / client authentication (`[ITI-YY5]`). |
| **`[ITI-YY3]`** | **Generate VHL** | VHL Holder | VHL Sharer | Requests generation of a Verifiable Health Link (`$generate-vhl`, `OperationDefinition/GenerateVHL`), optionally bound to a PCF `Consent` directive (`[ITI-108]`) and selective disclosure parameters, returning the signed VHL payload (e.g., HCERT / CWT / SMART Health Link URI). |
| **`[ITI-YY4]`** | **Provide VHL** | VHL Holder | VHL Receiver | Transfers the VHL payload from the VHL Holder's wallet (via QR code scan, deep link, or near-field exchange) to the VHL Receiver, which verifies the VHL signature using keys obtained via `[ITI-YY2]`. |
| **`[ITI-YY5]`** | **Retrieve Manifest** | VHL Receiver | VHL Sharer | Submits the verified VHL authorization token and context (including `purpose` of use and requester identity) to the VHL Sharer's manifest endpoint (`POST [base]/manifest` or equivalent) to obtain the `Bundle` of `DocumentReference` entries and retrieve the authorized clinical documents. |

### OperationDefinition: Generate VHL (`$generate-vhl`, `[ITI-YY3]`)

The `GenerateVHL` operation (`https://profiles.ihe.net/ITI/VHL/OperationDefinition/GenerateVHL`, code `generate-vhl`) is invoked on a **VHL Sharer** at the system level (`POST [base]/$generate-vhl`). It accepts subject identification, optional document selection or folder references, expiration / passcode parameters, and consent directive references, and returns the signed VHL payload for storage on the VHL Holder's Personal Health Wallet.

## Volume 3 — Conformance Artefacts in `ihe.iti.vhl@1.0.0-comment`

| ResourceType | ID | Title | Canonical URL |
|---|---|---|---|
| `ImplementationGuide` | `ihe.iti.vhl` | Verifiable Health Links (VHL) | `https://profiles.ihe.net/ITI/VHL/ImplementationGuide/ihe.iti.vhl` |
| `ActorDefinition` | `VHLHolder` | VHL Holder | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLHolder` |
| `ActorDefinition` | `VHLSharer` | VHL Sharer | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLSharer` |
| `ActorDefinition` | `VHLReceiver` | VHL Receiver | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/VHLReceiver` |
| `ActorDefinition` | `TrustAnchor` | Trust Anchor | `https://profiles.ihe.net/ITI/VHL/ActorDefinition/TrustAnchor` |
| `CapabilityStatement` | `IHE.VHL.VHLSharer` | VHL Sharer CapabilityStatement | `https://profiles.ihe.net/ITI/VHL/CapabilityStatement/IHE.VHL.VHLSharer` |
| `CapabilityStatement` | `IHE.VHL.VHLReceiver` | VHL Receiver CapabilityStatement | `https://profiles.ihe.net/ITI/VHL/CapabilityStatement/IHE.VHL.VHLReceiver` |
| `CapabilityStatement` | `IHE.VHL.TrustAnchor` | Trust Anchor CapabilityStatement | `https://profiles.ihe.net/ITI/VHL/CapabilityStatement/IHE.VHL.TrustAnchor` |
| `OperationDefinition` | `GenerateVHL` | Generate VHL (`$generate-vhl`) | `https://profiles.ihe.net/ITI/VHL/OperationDefinition/GenerateVHL` |
| `Requirements` | `AcceptMTLS` | Accept mTLS | `https://profiles.ihe.net/ITI/VHL/Requirements/AcceptMTLS` |
| `Requirements` | `AuditEventAccess` | Audit Event — Access | `https://profiles.ihe.net/ITI/VHL/Requirements/AuditEventAccess` |
| `Requirements` | `AuditEventCreateVHL` | Audit Event — Create VHL | `https://profiles.ihe.net/ITI/VHL/Requirements/AuditEventCreateVHL` |
| `Requirements` | `AuditEventReceivedVHL` | Audit Event — Received VHL | `https://profiles.ihe.net/ITI/VHL/Requirements/AuditEventReceivedVHL` |
| `Requirements` | `InitiateMTLS` | Initiate mTLS | `https://profiles.ihe.net/ITI/VHL/Requirements/InitiateMTLS` |
| `Requirements` | `PublishPKIMaterial` | Publish PKI Material (`[ITI-YY1]`) | `https://profiles.ihe.net/ITI/VHL/Requirements/PublishPKIMaterial` |
| `Requirements` | `ReceivePKIMaterial` | Receive PKI Material (`[ITI-YY1]`) | `https://profiles.ihe.net/ITI/VHL/Requirements/ReceivePKIMaterial` |
| `Requirements` | `RecordAccessToHealthData` | Record Access to Health Data | `https://profiles.ihe.net/ITI/VHL/Requirements/RecordAccessToHealthData` |
| `Requirements` | `RequestVHLDocuments` | Request VHL Documents (`[ITI-YY5]`) | `https://profiles.ihe.net/ITI/VHL/Requirements/RequestVHLDocuments` |
| `Requirements` | `RetrievePKIMaterial` | Retrieve PKI Material (`[ITI-YY2]`) | `https://profiles.ihe.net/ITI/VHL/Requirements/RetrievePKIMaterial` |
| `Requirements` | `UpdateKeyMaterial` | Update Key Material | `https://profiles.ihe.net/ITI/VHL/Requirements/UpdateKeyMaterial` |
| `Requirements` | `UtilizeVHL` | Utilize VHL (`[ITI-YY4]`) | `https://profiles.ihe.net/ITI/VHL/Requirements/UtilizeVHL` |
| `TestPlan` | `VHLSharerTestPlan` | VHL Sharer Test Plan | `https://profiles.ihe.net/ITI/VHL/TestPlan/VHLSharerTestPlan` |
| `TestPlan` | `VHLReceiverTestPlan` | VHL Receiver Test Plan | `https://profiles.ihe.net/ITI/VHL/TestPlan/VHLReceiverTestPlan` |
| `TestPlan` | `TrustAnchorTestPlan` | Trust Anchor Test Plan | `https://profiles.ihe.net/ITI/VHL/TestPlan/TrustAnchorTestPlan` |
