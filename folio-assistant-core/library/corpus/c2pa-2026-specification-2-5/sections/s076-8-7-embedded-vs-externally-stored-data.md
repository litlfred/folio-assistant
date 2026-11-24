---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s076-8-7-embedded-vs-externally-stored-data
section_title: "8.7. Embedded vs Externally-Stored Data"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 900-904
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 8.7. Embedded vs Externally-Stored Data

Some assertion data, due to its size or an infrequent need for it, may be externally hosted. Such data are not embedded in the assertion store, but instead are referenced by URI. This is accomplished through either a [cloud data](#_cloud_data) assertion for remotely-stored C2PA assertions (JUMBF) or an [external reference](#external_reference_assertion) assertion for either remotely stored assertion or non-assertion data. In both cases, the externally hosted data is not retrieved nor validated as part of manifest validation, and is only retrieved and validated when specifically needed by an application according to a different set of validation rules as described in [Section 14.10, “Validate the Assertions”](#_validate_the_assertions).

<a id="_redaction_of_assertions"></a>
