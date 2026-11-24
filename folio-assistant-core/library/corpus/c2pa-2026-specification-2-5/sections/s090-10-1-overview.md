---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s090-10-1-overview
section_title: "10.1. Overview"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1174-1183
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 10.1. Overview

A **claim** gathers together all the assertions about an asset at a given time including the set of assertions for [binding to the content](#_binding_to_content). The claim is then cryptographically hashed and signed as described in [Section 10.3.2.4, “Signing a Claim”](#_signing_a_claim). A claim is encoded as a JUMBF superbox with the label `c2pa.claim.v2` and a CBOR payload, which shall comply with the Core Deterministic Encoding Requirements of CBOR (see [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 4.2.1).

> **NOTE:**
> Previous versions supported the use of assertion metadata with claims, but this has been deprecated.

A previous version of this specification used the label `c2pa.claim` and associated `claim-map` for the Claim, but those have now been deprecated. Validators should still accept this label (and associated `claim-map`), but claim generators shall not produce such a claim.

<a id="_syntax"></a>
