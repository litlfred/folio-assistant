---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s598-a-5-3-1-3-live-media-fragmented-asset
section_title: "A.5.3.1.3. Live media fragmented asset"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11679-11685
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.5.3.1.3. Live media fragmented asset

For fMP4 assets which are live media transmissions, follow the instructions [here](#live-media).

As described [above](#exception-fmp4-manifest-init-seg), for fragmented MP4 (fMP4) streams that are live media transmissions in a 'push' streaming scenario (e.g., over-the-air broadcast television without a pull mechanism), the manifest box is only required to be included in a portion of initialization segments.

<a id="_box_containing_the_merkle_auxiliary"></a>
