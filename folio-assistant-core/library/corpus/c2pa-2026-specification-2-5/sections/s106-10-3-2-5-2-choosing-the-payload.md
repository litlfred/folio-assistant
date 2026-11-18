---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s106-10-3-2-5-2-choosing-the-payload
section_title: "10.3.2.5.2. Choosing the Payload"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1449-1458
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 10.3.2.5.2. Choosing the Payload

A previous version of this specification used the same value for the `payload` field in the time stamp as was used in the `Sig_signature` as described in [Section 10.3.2.4, “Signing a Claim”](#_signing_a_claim). This payload is henceforth referred to as a "v1 payload" in a "v1 time stamp" and is considered deprecated. A claim generator shall not create one, but a validator shall process one if present.

The "v2 payload", of the "v2 time stamp", is the value of the `signature` field of the `COSE_Sign1_Tagged` structure created as part of [Section 10.3.2.4, “Signing a Claim”](#_signing_a_claim). A "v2 payload" shall be used by claim generators performing a time stamping operation.

> **NOTE:**
> The value of the `signature` field includes the entire serialized `bstr`, including the bytes that indicate the major type and the length (not just the string itself).

<a id="_obtaining_the_time_stamp"></a>
