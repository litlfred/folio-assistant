---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s272-14-12-1-3-2-validation-result-codes
section_title: "14.12.1.3.2. Validation Result Codes"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3816-3827
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.12.1.3.2. Validation Result Codes

Standard result codes for text validation:

*   `assertion.dataHash.match`: Data hash validation succeeded
    
*   `assertion.dataHash.mismatch`: Data hash does not match, indicating tampering
    
*   `assertion.dataHash.malformed`: The data hash assertion is malformed (e.g., invalid exclusion ranges)
    

<a id="_partial_text_extraction"></a>
