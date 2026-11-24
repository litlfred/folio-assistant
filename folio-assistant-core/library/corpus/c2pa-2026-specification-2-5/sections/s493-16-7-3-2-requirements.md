---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s493-16-7-3-2-requirements
section_title: "16.7.3.2. Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9735-9771
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.3.2. Requirements

A session keys assertion shall have a label of `c2pa.session-keys`, and a C2PA Manifest may contain at most one session keys assertion.

The session keys assertion consists of a CBOR map (defined as a `session-keys-data`) and shall contain the following fields:

`keys`

An array of one or more session key objects.

Each session key in the `keys` array is represented as an object containing the following fields:

`key`

A COSE key that shall include a `kid` (key identifier) to ensure that the keys can be uniquely identified.

`minSequenceNumber`

An unsigned integer representing the earliest sequence number that can be signed with this key.

`createdAt`

The timestamp indicating when the session key was created formatted as CBOR tag 0 (RFC 3339 date-time).

`validityPeriod`

An unsigned integer representing the validity period of the session keys in seconds, starting from the `createdAt` timestamp

`signerBinding`

A detached signature of the Signer’s end-entity certificate, signed using the (private key) of the session key `key`, enabling verification that this session key used to protect the media is uniquely associated with the Signer. The payload of `Sig_structure` shall be the Signer’s end-entity certificate (the first certificate in the x5chain header parameter, as defined in [Section 13.5, “X.509 Certificates”](#x509_certificates) ) encoded as a CBOR byte string.

Session keys are valid from their individual `createdAt` until `createdAt + validityPeriod`, and shall only be used within their validity period. The `minSequenceNumber` field indicates the earliest segment sequence number that can be signed with a given key, supporting key rotation and preventing replay attacks.

When providing an new C2PA Manifest (via a C2PA Manifest Box), new session keys may be included in that C2PA Manifest. The new session keys may have overlapping validity periods with previous session keys, but the `minSequenceNumber` for the new keys shall be greater than or equal to the current sequence number. This ensures a clear transition between keys and supports overlap for seamless key rotation.

<a id="_schema_and_example_20"></a>
