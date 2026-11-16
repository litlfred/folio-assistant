---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s231-14-10-3-redacted-assertion-representation
section_title: "14.10.3. Redacted Assertion Representation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3036-3042
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.10.3. Redacted Assertion Representation

A redacted assertion may be represented in the assertion store either by being removed entirely, or by having its labelled assertion container retained with the JUMBF Content boxes within it replaced by a single UUID Content box whose `ID` field has a value of `CAA98EEE-9D4D-F80E-86AD-4DFFCA263973` (called the C2PA Redaction UUID) and whose `DATA` field contains only zeros (binary `0x00` values).

A validator shall accept either representation as a validly redacted assertion, as described in [Section 14.10.4, “Assertion Validation”](#_assertion_validation).

<a id="_assertion_validation"></a>
