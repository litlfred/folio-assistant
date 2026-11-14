---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s072-8-3-versioning
section_title: "8.3. Versioning"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 865-878
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 8.3. Versioning

When an assertion’s schema is changed, it should be done in a backwards-compatible manner. This means that new fields may be added and existing ones may be marked as deprecated (i.e., can be read, but never written). Existing fields shall not be removed. The label would then consist of an incremented version number, for example moving from `c2pa.actions` (deprecated) to `c2pa.actions.v2`.

Since the addition of optional fields can be done while maintaining backwards compatibility, such fields may be added to an existing assertion’s schema without a change to the version number.

Deprecated fields for C2PA standard assertions shall be indicated in [Chapter 16, _C2PA Standard Assertions_](#_c2pa_standard_assertions). Claim generators shall not insert data into deprecated assertion fields when creating assertions.

In those situations where a non-backwards compatible change is required, instead of increasing the label’s version number, the assertion shall be given a new label.

> **NOTE:**
> For example, `c2pa.ingredient` could be changed to the fictional `c2pa.component`.

<a id="_multiple_instances"></a>
