---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s339-16-3-2-1-description
section_title: "16.3.2.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4737-4755
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.2.1. Description

Portion(s) of a BMFF-based asset that a claim generator wishes to uniquely identify with a [hard binding](#_hard_bindings) (i.e., cryptographic hash) shall be described using BMFF-based hash assertions.

A BMFF-based hash assertion shall have a label of `c2pa.hash.bmff.v3`.

All Merkle trees used in BMFF-based hash assertions shall be balanced binary trees with the minimum depth necessary to accomodate leaf nodes, where NULL padding is applied only to the rightmost positions as needed to maintain the complete binary tree structure. This also requires that each level be more than half full, see [Section 16.3.2.6, “Validation”](#bmff-validation).

> **NOTE:**
> Earlier versions of this specification also documented `c2pa.hash.bmff` and `c2pa.hash.bmff.v2` assertions.

> **IMPORTANT:**
> Validators shall ignore any `c2pa.hash.bmff` assertions, processing the manifest as if the assertion were not present.

A BMFF-based hash assertion shall not appear in a [cloud data assertion](#_cloud_data) nor an [external reference assertion](#_external_reference).

A previous version of this specification provided a `url` field to provide a pointer to where the hashed data can be located, but it was never used. This field is now deprecated in favour of the [asset reference assertion](#_asset_reference). Claim generators shall not add this field to a BMFF hash assertion, and consumers shall ignore the field when present, except this shall not affect inclusion of the field as part of the content being validated as described in [Section 14.10.4, “Assertion Validation”](#_assertion_validation).

<a id="bmff-hash-computation"></a>
