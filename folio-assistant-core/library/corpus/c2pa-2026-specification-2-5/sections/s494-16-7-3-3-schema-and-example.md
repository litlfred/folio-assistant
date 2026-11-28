---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s494-16-7-3-3-schema-and-example
section_title: "16.7.3.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9772-9851
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.3.3. Schema and Example

The schema for this type is defined by the `session-keys-data` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.6.2, “Session Keys”](#cddl_annex_session_keys) for the complete normative schema):

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

An example in CBOR Diagnostic Format (`.cbordiag`) is shown below:

```none
{
  "label": "c2pa.session-keys",
  "kind": "Cbor",
  "data": {
    "keys": [
      {
        "key": {
          1: 2,                                    / kty: EC2 /
          2: h'6b65795f303031',                    / kid: "key_001" /
          -1: 1,                                   / crv: P-256 /
          -2: h'18b4ca7f19bb7ad4e8e5e28a8c9a7fb8e0bb5e5c9e5b8e5d7f4c8a9b7c6d5e4f3', / x /
          -3: h'1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809'  / y /
        },
        "minSequenceNumber": 175,
        "createdAt": 0("2025-07-29T10:00:00Z"),
        "validityPeriod": 3900,
        "signerBinding": 18([
          / protected / h'a10126', 
          / unprotected / {},
          / payload / h'', 
          / signature / h'3046022100abcd...'
        ])
      },
      {
        "key": {
          1: 2,                                    / kty: EC2 /
          2: h'6b65795f303032',                    / kid: "key_002" /
          -1: 1,                                   / crv: P-256 /
          -2: h'abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd', / x /
          -3: h'1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'  / y /
        },
        "minSequenceNumber": 1975,
        "createdAt": 0("2025-07-29T11:00:00Z"),
        "validityPeriod": 3900,
        "signerBinding": 18([
          / protected / h'a10126', 
          / unprotected / {},
          / payload / h'', 
          / signature / h'3046022100dcba...'
        ])
      }
    ]
  }
}
```

<a id="_policy_disclosure"></a>
