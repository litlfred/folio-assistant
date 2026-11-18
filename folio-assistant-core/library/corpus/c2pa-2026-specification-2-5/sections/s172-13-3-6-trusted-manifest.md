---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s172-13-3-6-trusted-manifest
section_title: "13.3.6. Trusted Manifest"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2203-2212
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 13.3.6. Trusted Manifest

A C2PA Manifest is Trusted if validation determines that each of the following is true:

*   The manifest is Valid \[[Section 13.3.5, “Valid Manifest”](#_valid_manifest)\].
    
*   The signing credential of the C2PA Manifest receives the success code of `signingCredential.trusted` \[[Section 14.7, “Validate the Signature”](#_validate_the_signature)\].
    

<a id="_trust_lists"></a>
