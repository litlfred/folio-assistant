---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s332-16-3-1-1-description
section_title: "16.3.1.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4628-4649
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.1.1. Description

The most common way to uniquely verify the integrity of portions of a non-BMFF-based asset is via the [hard bindings](#_hard_bindings) (i.e., cryptographic hash) present in data hash assertions. However, for those formats that are "box like" but not compatible with BMFF, the [general box hash](#_general_box_hash) assertion is recommended.

The `alg` field, if present, shall be a string that is one of the allowed hash algorithms as defined in [Section 12.1, “Hashing”](#_hashing), and that algorithm shall be used to compute the hash. If the `alg` field is not present, then the hashing algorithm shall be determined by the value of the `alg` field in the Claim. The hash value shall be present in the `hash` field.

Each data hash assertion defines a specified range of bytes over which the hash has been computed. If only a portion of the asset shall be hashed, then the range(s) to be excluded shall be present in the array value of the `exclusions` field. These excluded ranges shall be ordered by increasing start position and shall not overlap.

For data hash exclusion ranges, the range shall begin and end within the same logical unit (e.g., box, segment, object) and shall not overlap with any header or length field associated with that unit, except for freebox or pad data. It is the responsibility of the claim generator to define exclusion ranges in a way that ensures that whatever data an attacker might place in those ranges cannot materially affect the interpretation of the asset. Furthermore, the claim generator shall ensure the exclusion range only contains content from C2PA Manifest Store, or asset metadata (e.g., EXIF, IPTC metadata). Example metadata that could be skipped can be unverified user name or image rotation information.

A previous version of this specification provided a `url` field to provide a pointer to where the hashed data can be located, but it was never used. This field is now deprecated in favour of the [asset reference assertion](#_asset_reference). Claim generators shall not add this field to a data hash assertion, and consumers shall ignore the field when present, except this shall not affect inclusion of the field as part of the content being validated as described in [Section 14.10.4, “Assertion Validation”](#_assertion_validation).

A data hash assertion shall have a label of `c2pa.hash.data`.

A data hash assertion shall not appear in a [cloud data assertion](#_cloud_data) or an [external reference assertion](#_external_reference).

A data hash assertion shall not be used with a [compressed manifest](#_compressed_manifests).

> **NOTE:**
> This restriction exists to address a technical incompatibility between the two.

<a id="_schema_and_example_2"></a>
