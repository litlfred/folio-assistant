---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s057-5-1-compatibility
section_title: "5.1. Compatibility"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 567-577
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 5.1. Compatibility

As the Content Credentials specification has evolved, constructs such as box labels, assertions (and their fields), claims and time stamps have also evolved. New assertions have been added, and some existing assertions and the claim have newer versions with additional fields. In addition, some constructs have been deprecated. In this specification, when a construct is marked as deprecated, that means that a claim generator shall not write that construct (or value), but that a validator should read it.

To facilitate testing and diagnosing interoperability issues between claim generators and validators, a claim generator should declare which version of the specification it is using to generate the C2PA Manifest by providing a [`specVersion` key](#claim-specVersion) in the `claim_generator_info` field of the claim. When a claim generator sets this field, it is declaring that the active manifest of the asset is produced in accordance with that version of the specification and thus, for example, does not contain any constructs that are deprecated in that version of the specification (see [Table 21, “Status of constructs”](#deprecated_constructs_table) of [Appendix E, _Considerations for Deprecation_](#versioning_annex)).

A validator shall be compatible with at least one version of the specification, but may be compatible with additional versions. A validator that is compatible with a specific version of the specification shall support all non-deprecated constructs listed for that version. If the validator encounters a C2PA Manifest that uses constructs from a version of the specification that the validator does not support (either because they are deprecated or unknown), it may ignore the unsupported construct and process the rest of C2PA Manifest as if that construct were not present.

When a claim generator is performing ingredient validation, it should add a [`specVersion` key](#validation-results) to the `validation-results-map` to declare what version of the specification was used as the basis for the validation procedure.

<a id="_forward_compatibility"></a>
