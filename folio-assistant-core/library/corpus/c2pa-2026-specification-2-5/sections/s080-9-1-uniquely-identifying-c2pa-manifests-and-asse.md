---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s080-9-1-uniquely-identifying-c2pa-manifests-and-asse
section_title: "9.1. Uniquely Identifying C2PA Manifests and Assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 956-1023
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 9.1. Uniquely Identifying C2PA Manifests and Assets

Every C2PA Manifest is uniquely identified and referenced by a Uniform Resource Name [RFC 8141, URNs](https://www.rfc-editor.org/rfc/rfc8141) from the `c2pa` URN namespace, and a C2PA asset is uniquely identified by the `c2pa` URN value of its active manifest. The ABNF for the C2PA URN is described by [ABNF for C2PA URN](#abnf_for_urn).

A `c2pa` URN shall consist of two mandatory and two optional components, in the following order, with colons (`:`) between each section.

*   URN identifier (`urn:c2pa`): REQUIRED.
    
*   UUID v4, in string representation (as per [RFC 9562, UUIDs](https://www.rfc-editor.org/rfc/rfc9562), section 4): REQUIRED.
    
*   Claim Generator identifier string : OPTIONAL.
    
*   Version and Reason string (as described below) : OPTIONAL.
    

When present, the "Claim Generator identifier" string shall consist of no more than 32 characters from the ASCII range (as per RFC 20), but which are not Control Characters (RFC 20, 5.2) or Graphic Characters (RFC 20, 5.3).

When present, the "Version and Reason" string shall consist of a positive integer, followed by an underscore (`_`) and then another positive integer. The details of each of these values and how they are to be used is described in [Versioning Manifests Due to Conflicts](#_versioning_manifests_due_to_conflicts). In addition, when a "Version and Reason" string is present, a "Claim Generator identifier" string shall also be present but it may be empty.

ABNF for C2PA URN

```abnf
c2pa_urn = c2pa-namespace UUID [claim-generator [version-reason]]

c2pa-namespace = "urn:c2pa:"

; this definition is taken from RFC 9562
UUID     =  4hexOctet "-"
			2hexOctet "-"
			2hexOctet "-"
			2hexOctet "-"
			6hexOctet
hexOctet = HEXDIG HEXDIG
DIGIT    = %x30-39
HEXDIG   = DIGIT / "A" / "B" / "C" / "D" / "E" / "F"

; ASCII, but not Control Characters or Graphic Characters
visible-char-except-space = %x21-7E / %x80-FF

; claim-generator-identifier is a string of 0 to 32 visible-char-except-space characters
; this means that an empty string is valid
claim-generator = ":" claim-generator-identifier
claim-generator-identifier = 0*32visible-char-except-space

; version-reason is a string consisting of a positive integer 
; followed by an underscore and a positive integer
version-reason = ":" version "_" reason
version = 1*DIGIT
reason = 1*DIGIT
```

Examples:

*   `urn:c2pa:F9168C5E-CEB2-4FAA-B6BF-329BF39FA1E4`
    
*   `urn:c2pa:F9168C5E-CEB2-4FAA-B6BF-329BF39FA1E4:acme`
    
*   `urn:c2pa:F9168C5E-CEB2-4FAA-B6BF-329BF39FA1E4:acme:2_1`
    
*   `urn:c2pa:F9168C5E-CEB2-4FAA-B6BF-329BF39FA1E4::2_1`
    

> **NOTE:**
> Previous versions of this specification used [RFC 9562, UUIDs](https://www.rfc-editor.org/rfc/rfc9562) URN, and had the identifier of the claim generator at the beginning of the URN. However, this was found to be not in compliance with either [RFC 9562, UUIDs](https://www.rfc-editor.org/rfc/rfc9562) or [RFC 8141, URNs](https://www.rfc-editor.org/rfc/rfc8141).

This `c2pa` URN identifier is used in various parts of a C2PA-enabled workflow, such as when identifying an asset as an [ingredient](#ingredient_assertion) in a derived or composed asset.

<a id="_versioning_manifests_due_to_conflicts"></a>
