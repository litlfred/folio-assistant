---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s155-12-3-digital-signatures
section_title: "12.3. Digital Signatures"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1967-1984
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 12.3. Digital Signatures

All claim signatures shall be generated using one of the digital signature algorithms and key types listed as described in this section. This section defines both:

*   A list of digital signature algorithms and key types that generators should use for new claim signatures and that validators shall support for validating existing claim signatures (the allowed list);
    
*   A list of digital signature algorithms and key types that validators should support for validating existing claim signatures but that generators shall not use for creating new claim signatures (the deprecated list).
    

> **NOTE:**
> This section does not govern digital signatures used by custom assertions that are defined outside of this specification. It also does not govern time stamps.

These lists establish the allowed algorithms and key types by referencing an algorithm identifier from the relevant standards that define algorithms for COSE and their mappings to CBOR identifiers, including but not limited to [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), [RFC 9053](https://www.rfc-editor.org/rfc/rfc9053), [RFC 8230](https://www.rfc-editor.org/rfc/rfc8230), and [RFC 9964](https://www.rfc-editor.org/rfc/rfc9964). These standards also specify the hash algorithm used in the signature scheme. Nothing in [Section 12.1, “Hashing”](#_hashing) shall apply to this use of hash algorithms; if a digital signature algorithm is present in the digital signature algorithm and key type [below](#_signature_algorithms), the use of its specified hash algorithm in the signature scheme shall be allowed and followed.

> **NOTE:**
> Parenthetical notes in the lists below are explainers provided only as an aid to the reader.

<a id="_signature_algorithms"></a>
