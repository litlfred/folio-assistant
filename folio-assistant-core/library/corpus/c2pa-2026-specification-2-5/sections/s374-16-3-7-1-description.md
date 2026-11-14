---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s374-16-3-7-1-description
section_title: "16.3.7.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6210-6220
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.7.1. Description

If a claim generator will be providing a soft binding for the asset’s content, it shall be described using a soft binding assertion. The types of soft bindings which may be created and stored in such an assertion are described in [Section 16.3.7, “Soft Binding”](#soft_binding_assertion).

A previous version of this specification provided a `url` field to provide a pointer to where the hashed data may be located, but it was never used. This field is now deprecated in favor of the [asset reference assertion](#_asset_reference). Claim generators shall not add this field to a soft binding assertion, and consumers shall ignore the field when present, except this shall not affect inclusion of the field as part of the content being validated as described in [Section 14.10.4, “Assertion Validation”](#_assertion_validation).

A previous version of this specification provided an `extent` field within the `scope` field to describe a portion of the digital content covered by the soft binding assertion, in an algorithm specific format. This field is now deprecated in favor of the `region` field. Claim generators shall not add this field to a soft binding assertion, and consumers should ignore the field when present. This does not affect inclusion of the field as part of the content being validated as described in [Section 14.10.4, “Assertion Validation”](#_assertion_validation).

A soft binding assertion shall have a label of `c2pa.soft-binding`.

<a id="_schema_and_example_8"></a>
