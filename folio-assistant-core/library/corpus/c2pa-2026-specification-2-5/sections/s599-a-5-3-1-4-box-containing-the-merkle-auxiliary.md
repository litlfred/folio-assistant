---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s599-a-5-3-1-4-box-containing-the-merkle-auxiliary
section_title: "A.5.3.1.4. Box containing the merkle auxiliary"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11686-11698
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### A.5.3.1.4. Box containing the merkle auxiliary

Regardless of how the asset is structured, the fields in the corresponding box described above shall be set as follows.

box\_purpose

For an auxiliary `'uuid'` C2PA box, this value shall be `merkle`.

data

When `box_purpose` is `merkle`, this value shall contain raw CBOR bytes indicating how to validate a portion of the asset as defined as follows. If there are multiple auxiliary `'uuid'` C2PA boxes with `box_purpose` `merkle` for a given Merkle tree in a single file, each shall be followed by sufficient padding bytes (zero or more) to make all auxiliary `'uuid'` C2PA boxes for that Merkle tree a fixed size.

<a id="_regarding_unique_ids"></a>
