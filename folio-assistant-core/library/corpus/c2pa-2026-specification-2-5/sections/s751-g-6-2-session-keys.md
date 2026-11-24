---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s751-g-6-2-session-keys
section_title: "G.6.2. Session Keys"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 15751-15779
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.6.2. Session Keys

```cddl
; Data structure to supply session keys used for live-media validation
session-keys-data = {
    "keys" => [1* session-key], ; one or more session keys
}

session-key = {
    ; session key used to sign the `verifiable-segment-info-map`, note:
    ; semantics need to require kid in COSE_Key
    "key" => COSE_Key,

    ; minimum sequence number that can be signed with this key
    "minSequenceNumber" => uint
    "createdAt" => #6.0(tstr), ; CBOR tag 0 (RFC 3339 date-time)

    ; seconds from createdAt, key is valid for this period between createdAt and
    ; createdAt + validityPeriod
    "validityPeriod" => uint,

    ; A signature of the Signer's end-entity certificate, using the session key
    ; `key`, enabling verification that the session key is associated with this
    ; Signer
    "signerBinding" => COSE_Sign1_Tagged,
}
```

<a id="cddl_annex_time_stamp"></a>
