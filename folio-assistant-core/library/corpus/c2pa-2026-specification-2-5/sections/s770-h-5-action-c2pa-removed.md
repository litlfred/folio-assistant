---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s770-h-5-action-c2pa-removed
section_title: "H.5. Action `c2pa.removed`"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16171-16177
source_sha256: ff401df19d1fde8c
granularity: heading
---
### H.5. Action `c2pa.removed`

A previous version of this specification allowed claim generators to write the action `c2pa.removed` for `componentOf` ingredients that have been removed. This action has since been deprecated in favour of using the `ingredient` field of the `c2pa.deleted` action. Claim generators shall not use the `c2pa.removed` action.

Validators should continue to accept the `c2pa.removed` action for backwards compatibility.

<a id="_validation_rule"></a>
