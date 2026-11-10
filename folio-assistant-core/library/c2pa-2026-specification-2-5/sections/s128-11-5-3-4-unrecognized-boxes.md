---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s128-11-5-3-4-unrecognized-boxes
section_title: "11.5.3.4. Unrecognized Boxes"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1693-1705
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 11.5.3.4. Unrecognized Boxes

The C2PA Manifest Store (`c2pa`) and C2PA Manifest (`c2ma`, `c2um`, `c2cm`, and `c2md`) may also contain JUMBF boxes and superboxes that satisfy the requirements in [Section 11.5.3.2, “Toggles”](#_toggles) and [Section 11.5.3.3, “Labels”](#jumbf_labels) and whose JUMBF type UUIDs are not defined in this specification.

> **NOTE:**
> Allowing other boxes and superboxes enables custom extensions to C2PA as well as enabling the addition of new boxes in future versions of this specification without breaking compatibility.

If the _Requestable_ and _Label Present_ toggles are both set in the JUMBF Description box of any JUMBF box or superbox, that box or superbox shall be maintained in any updated C2PA Manifest Store.

> **NOTE:**
> Boxes with those toggles set are intended to be referenced via JUMBF URIs, and their removal could cause downstream workflows to fail.

<a id="_jumbf_rationale"></a>
