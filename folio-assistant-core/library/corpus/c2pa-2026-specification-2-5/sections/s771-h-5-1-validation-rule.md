---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s771-h-5-1-validation-rule
section_title: "H.5.1. Validation rule"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16178-16180
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### H.5.1. Validation rule

Check that the `ingredients` field (or `ingredient` field for `c2pa.actions`) contains one or more valid hashed URIs, each of which can be resolved to an ingredient assertion in another manifest whose `relationship` field is `componentOf`. If not, then the claim shall be rejected with a failure code of `assertion.action.ingredientMismatch`.
