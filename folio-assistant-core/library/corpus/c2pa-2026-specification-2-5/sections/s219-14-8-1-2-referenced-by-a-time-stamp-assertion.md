---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s219-14-8-1-2-referenced-by-a-time-stamp-assertion
section_title: "14.8.1.2. Referenced by a time stamp assertion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2844-2850
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.8.1.2. Referenced by a time stamp assertion

If a validator has already located a TimeStampToken in a `sigTst` or `sigTst2` header, that passes validation (as per [Section 14.8.2, “Validating the TimeStampToken”](#_validating_the_timestamptoken)), then it shall skip this step. When no such header exists or the TimeStampToken located there did not pass validation, this step shall be followed.

If a validator had previously located any [time stamp assertions](#timestamp_assertion), which were then maintained in a mapping of C2PA Manifest identifiers to TimeStampTokens, then the validator shall check if the current C2PA Manifest’s identifier is present in the mapping. If it is, the validator shall use the TimeStampToken associated with the identifier in the mapping for the TimeStampToken in the validation process described in [Section 14.8.2, “Validating the TimeStampToken”](#_validating_the_timestamptoken). If more than one TimeStampToken for that identifier is found in the mapping, the validator shall try each one until one successfully passes validation (and then should ignore the others). If the identifier does not appear in the mapping, no error is raised, as it simply means that there is no TimeStampToken associated with this C2PA Manifest in the current context.

<a id="_validating_the_timestamptoken"></a>
