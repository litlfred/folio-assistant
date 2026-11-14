---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s241-14-10-4-2-7-c2pa-time-stamp-validation
section_title: "14.10.4.2.7. `c2pa.time-stamp` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3350-3356
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.7. `c2pa.time-stamp` validation

If the assertion’s label is `c2pa.time-stamp`, the validator shall ensure that the assertion is well-formed CBOR consisting of a single map (Major type `5`) with at least one key/value pair. If this is not the case, the claim shall be rejected with a failure code of `assertion.timestamp.malformed`.

Since validation of the time stamp token is performed as described in [Section 14.8.2, “Validating the TimeStampToken”](#_validating_the_timestamptoken), the validator needs to store the time stamp token (and its associated C2PA Manifest identifier) for later use.

<a id="alternative_content_representation_validation"></a>
