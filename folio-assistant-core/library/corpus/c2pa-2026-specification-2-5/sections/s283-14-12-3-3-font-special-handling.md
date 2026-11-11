---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s283-14-12-3-3-font-special-handling
section_title: "14.12.3.3. Font Special Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3942-3948
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.12.3.3. Font Special Handling

When validating a font, a validator shall check that the box corresponding with the font’s `C2PA` table is present, and determine whether it contains an embedded manifest, a remote manifest URI or both.

If any font tables are present which are not covered by any box, then the manifest shall be rejected with a failure code of `assertion.boxesHash.unknownBox`.

<a id="validating_a_multi_asset_hash"></a>
