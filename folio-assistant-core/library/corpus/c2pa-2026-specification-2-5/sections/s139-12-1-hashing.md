---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s139-12-1-hashing
section_title: "12.1. Hashing"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1835-1870
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 12.1. Hashing

All cryptographic hashes used in the creation and validation of C2PA Manifests (and their contents) as per the technical requirements of this specification shall be generated using one of the hash algorithms as described in this section. This section defines both:

*   A list of hash algorithms that generators should use for generating hashes of new content and that validators shall support for validating hashes of existing content (the allowed list);
    
*   A list of hash algorithms that validators should support for validating hashes of existing content but that generators shall not produce (the deprecated list).
    

> **NOTE:**
> This section does not govern algorithms used for soft bindings as described in [Section 16.3.7, “Soft Binding”](#soft_binding_assertion).

> **NOTE:**
> This section does not govern algorithms used by custom assertions that are defined outside of this specification.

An algorithm shall appear in no more than one list. An algorithm that is instantiated over multiple output lengths (such as the various lengths of SHA2) will each be considered different algorithms, and each instantiation shall be listed separately. If an algorithm does not appear in either list, it is forbidden and shall not be used or supported. Algorithms can be removed from the lists in order to implement forbidding an algorithm. For this reason, implementations shall not support additional algorithms on an optional basis.

Implementers should consult this section in the current version of the specification when releasing software updates and ensure their supported algorithms conform to it.

These lists establish the allowed algorithms for creating hashes and a string algorithm identifier to be used as the algorithm identifier (usually called `alg`) in the corresponding field of C2PA data structures. The outputs of hash functions shall be stored as their binary values encoded into CBOR as byte strings (major type 2) with a declared length. Wherever a field contains the output of a hash function, an algorithm identifier string field shall be present within the same structure, or within an enclosing structure, or in the `claim-map` or `claim-map-v2` structure to declare which algorithm was used. A hash algorithm identifier field should be present in exactly one of these places, but if more than one is present within the structure and its enclosing structures, the nearest identifier shall be used. Nearest is defined first as an identifier that is a sibling field of the hash value, and then the immediately enclosing structure, up to the root structure. If no identifier is present in any of these places, then the `alg` field from the `claim-map` or `claim-map-v2` structure shall be used.

The allowed list is:

*   SHA2-256 ("sha256");
    
*   SHA2-384 ("sha384");
    
*   SHA2-512 ("sha512").
    

> **NOTE:**
> The SHA-3 family of hash algorithms are not on the allowed list for consistency with the digital signature algorithm allowed list, because COSE has not yet established digital signature algorithms that use a SHA-3 algorithm as the hash algorithm.

The deprecated list is empty.

<a id="_binding_to_content"></a>
