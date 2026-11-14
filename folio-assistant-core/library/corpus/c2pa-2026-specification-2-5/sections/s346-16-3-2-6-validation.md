---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s346-16-3-2-6-validation
section_title: "16.3.2.6. Validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5294-5304
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.2.6. Validation

Validating a given chunk requires first validating the `merkle-map` field’s `initHash` over the corresponding initialization segment and then locating the correct entry in the `merkle-map` field’s `hashes` array and validating it against the hash of the chunk’s data, and if needed, deriving that hash using the Merkle proof from the `hashes` specified in the chunk’s `bmff-merkle-map`.

![Validating the fragmented BMFF data](_images/BMFF_Validation.svg)

Figure 16. Validating intitialization segment and a chunk’s data example

To verify track chunk **m+3** you must first verify the corresponding initialization segment. The c2pa-specific manifest box in each Track’s initialization segment will contain the Manifest store. If the asset contains multiple initialization segments then the Manifest store must be identical in each. This allows validators to verify a Track belong to the larger set. The active manifest’s `c2pa.hash.bmff.v3` assertion will contain a `merkle` field with an array of `merkle-map` objects, one per track.

<a id="_steps"></a>
