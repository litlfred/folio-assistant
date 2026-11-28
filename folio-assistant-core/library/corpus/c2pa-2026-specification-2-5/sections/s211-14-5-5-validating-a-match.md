---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s211-14-5-5-validating-a-match
section_title: "14.5.5. Validating a Match"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2762-2768
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.5.5. Validating a Match

A validator may wish to validate that the located C2PA Manifest Store is indeed the one associated with asset.

If the C2PA Manifest Store was located then the hard binding assertion present in its active manifest shall be used to validate that it is the matching manifest and whether the asset has been modified without manifest updates. If the hard binding does not match, it is unknown if that is because of (a) modification of the asset or (b) the wrong C2PA Manifest Store was located. Accordingly, the validator shall treat this as a non-matching hard binding and reject the manifest with a failure code of `assertion.dataHash.mismatch` if a data hash assertion is used, `assertion.boxesHash.mismatch` if a general box hash assertion is used, `assertion.collectionHash.mismatch` if a collection data hash assertion is used, `assertion.segmentHash.mismatch` if a segment hash assertion is used, or `assertion.bmffHash.mismatch` if a BMFF hash assertion is used.

<a id="validating_the_claim"></a>
