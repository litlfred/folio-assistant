---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s445-16-5-13-4-2-v2-ingredient-assertions-deprecated
section_title: "16.5.13.4.2. V2 ingredient assertions (DEPRECATED)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8633-8641
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.5.13.4.2. V2 ingredient assertions (DEPRECATED)

In a v2 ingredient assertion with no `c2pa_manifest` field, the `validationStatus` field is optional, but if present may contain an empty array.

In a v2 ingredient assertion with `c2pa_manifest` field, each object in the `validationStatus` array consists of a `code` field whose value describes the validation status of a specific part of the manifest along with an optional `success` field whose boolean value indicates whether the code reflects success (true) or failure (false). An optional description of the validation status may be present in the `explanation` field if there is a need for an additional human readable explanation. In addition, each `status-map` object has a `url` field which should contain, in the case of failures, a JUMBF URI reference to the specific element in the manifest about which the status refers. Depending on the code, the `url` will be to a C2PA Claim, a C2PA Claim Signature or a specific C2PA Assertion. Status codes are defined in [Appendix D, _Standard Validation Status Codes_](#validation_codes_annex).

Custom status codes are permitted when a claim generator has a need to record some process-specific status information. The code shall conform to the same syntax as [entity-specific namespaces](#_namespacing) (e.g. `com.litware.malformedFrobber`) and the `validationStatus` object shall contain a `success` boolean.

<a id="_v3_ingredient_assertions"></a>
