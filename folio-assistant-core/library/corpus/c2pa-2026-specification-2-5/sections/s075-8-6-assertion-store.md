---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s075-8-6-assertion-store
section_title: "8.6. Assertion Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 891-899
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 8.6. Assertion Store

The set of assertions referenced by a [claim](#_claims) in a manifest are collected together into a logical construct that is referred to as the _assertion store_. The assertions and assertion store shall be stored as described in [Section 11.5, “Serialization”](#_serialization); in particular, each assertion referenced in a claim’s `created_assertions` or `gathered_assertions` (but not [`redacted_assertions`](#_redaction_of_assertions)) shall be present in the assertion store located in the same C2PA Manifest as the claim.

In each manifest, there is a single assertion store. However, as an asset may have multiple manifests associated with it, each one representing a specific series of assertions, there may be multiple assertion stores associated with an asset.

Each assertion in the assertion store should include a randomly-generated salt in the private `c2sh` box within its JUMBF Description Box, as documented in [Section 9.4.2.3, “Hashing JUMBF Boxes”](#_hashing_jumbf_boxes), so that subsequent generators can [redact assertions](#_redaction_of_assertions) securely.

<a id="_embedded_vs_externally_stored_data"></a>
