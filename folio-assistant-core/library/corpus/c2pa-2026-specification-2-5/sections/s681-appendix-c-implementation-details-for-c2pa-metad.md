---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s681-appendix-c-implementation-details-for-c2pa-metad
section_title: "Appendix C: Implementation Details for `c2pa.metadata`"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12725-12734
source_sha256: ff401df19d1fde8c
granularity: heading
---
## Appendix C: Implementation Details for `c2pa.metadata`

The `c2pa.metadata` assertion shall only contain the subset of schemas and their fields as described below. However [custom metadata assertions](#_common_requirements) may contain any values from these or other schemas.

> **NOTE:**
> A machine readable list of all the valid schemas and their fields can be found on the [C2PA Specification Website](https://spec.c2pa.org/specifications/specifications/2.3/specs/_attachments/C2PA_Schemas.zip).

The values present in a `c2pa.metadata` assertion may be unique to the metadata assertion or they may be taken from the standard "metadata blocks" of the asset format. In either case, they shall be serialized according to the rules of [JSON-LD serialization of XMP](https://www.iso.org/standard/79384.html) as described [here](#_common_requirements).

<a id="_completely_supported_schemas"></a>
