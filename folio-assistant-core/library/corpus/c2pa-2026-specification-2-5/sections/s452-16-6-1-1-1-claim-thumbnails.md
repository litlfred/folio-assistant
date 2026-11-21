---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s452-16-6-1-1-1-claim-thumbnails
section_title: "16.6.1.1.1. Claim Thumbnails"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8807-8813
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.6.1.1.1. Claim Thumbnails

For thumbnails created at claim creation time, the thumbnail assertion shall have the label `c2pa.thumbnail.claim`. There shall be no more than one thumbnail assertion with this label in a C2PA Manifest.

Previous versions of this specification required that the IANA registry media type of the thumbnail be included in the label name (e.g., `c2pa.thumbnail.claim.png`). This naming convention has been deprecated.

<a id="_ingredient_thumbnails"></a>
