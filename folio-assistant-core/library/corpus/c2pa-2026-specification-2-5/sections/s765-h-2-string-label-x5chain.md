---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s765-h-2-string-label-x5chain
section_title: "H.2. String Label `x5chain`"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16110-16117
source_sha256: ff401df19d1fde8c
granularity: heading
---
### H.2. String Label `x5chain`

> **IMPORTANT:**
> Use of the string label `x5chain` for the X.509 certificate chain COSE header is deprecated. Claim generators shall use the integer label `33` instead, as described in [Section 13.5, “X.509 Certificates”](#x509_certificates).

A previous version of this specification required claim generators to write the string label `x5chain` for the certificate chain header parameter, to avoid a dependency on the integer label `33` being standardised. Integer label `33` has since been standardised by [RFC 9360](https://www.rfc-editor.org/rfc/rfc9360), and the string label is no longer needed. Validators shall continue to accept the string label `x5chain` for backwards compatibility.

<a id="_data_boxes"></a>
