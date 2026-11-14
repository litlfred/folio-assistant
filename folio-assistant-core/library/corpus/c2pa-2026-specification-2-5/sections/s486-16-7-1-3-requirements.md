---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s486-16-7-1-3-requirements
section_title: "16.7.1.3. Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9677-9683
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.7.1.3. Requirements

A certificate status assertion shall have a label of `c2pa.certificate-status`, and a C2PA Manifest shall contain at most one certificate status assertion.

The certificate status assertion consists of a CBOR map (defined as a `certificate-status-map`) and shall contain at least one entry in the `ocspVals` array. As described in [Section 13.5.2, “Certificate Revocation”](#_certificate_revocation), the claim generator queries the OCSP service indicated by the signing certificate, captures the response, and shall store it the same binary format as used when it is stored as an element of the `ocspVals` array of the `rVals` header (see [Section G.6.4, “Revocation Values (`rVals`)”](#cddl_annex_rvals)).

<a id="timestamp_assertion"></a>
