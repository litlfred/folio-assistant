---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s239-14-10-4-2-5-c2pa-metadata-validation
section_title: "14.10.4.2.5. `c2pa.metadata` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3338-3344
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.5. `c2pa.metadata` validation

No assertion-specific validation is required for `c2pa.metadata`.

Previous versions of this specification required validators to check metadata against the [allowed list](#metadata_annex). While generators are [still required](#_the_c2pa_metadata_assertion) to limit provided metadata to this set of fields, validators should not reject assertions containing unlisted fields, to support forward compatibility as the allowed list evolves.

<a id="_c2pa_session_keys_validation"></a>
