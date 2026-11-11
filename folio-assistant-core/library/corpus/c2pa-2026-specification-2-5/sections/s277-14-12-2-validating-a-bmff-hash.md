---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s277-14-12-2-validating-a-bmff-hash
section_title: "14.12.2. Validating a BMFF-hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3859-3885
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.12.2. Validating a BMFF-hash

For any portions of an asset rendered for presentation to a user, including but not limited to audio, video, or text, the corresponding hard binding corresponding to the rendered content shall be validated in accordance with [Section 12.2.2, “Hard Bindings”](#_hard_bindings). If the standard hard binding does not validate, and a multi-asset hash assertion is present, it shall be validated as described in [Section 14.12.4, “Validating a multi-asset hash”](#validating_a_multi_asset_hash). If at any time content fails to be validated, the validator shall clearly signal to the user that some of the content does not match the claim, and if possible, should indicate what part of the content did not validate. If any content is absent for which content bindings exist, discovery of this absence is also a validation failure. The validator shall continue to report validation has failed, even if later portions of the content validate correctly.

For content that is not wholly available before rendering begins, such as during adaptive bitrate streaming (ABR) and progressive download, absence of not-yet-available portions of content is not considered a validation failure. As the content becomes available, the validator shall validate each portion of the content before it is rendered as previously described. In addition, the validator shall validate that the sequence of said content is the same as when the manifest was produced. Unless the player has explicitly signalled the validator that a discontinuity is expected (e.g., when the consumer performs a manual seek operation via the UI), the validator shall clearly signal to the user that an unexpected discontinuity has occurred whenever the sequence does not match. This includes validating that the `location` values for a given Merkle tree start at zero and increments by one for each following chunk; equivalently, the `location` value always indicates which chunk is being rendered.

For content that is to be validated during playback via progressive download, the leaf nodes of the merkle tree may align to synchronization points of the video track in the `'mdat'` (e.g., the RAP points random access points). When the `'variableBlockSizes'` are setup to achieve such alignment, validation during linear playback or seeking to desired playback time can be both achieved via the same sequence. The desired blocks shall be fetched, validated and the tracks within them selected for rendering.

For content that is intentionally not being rendered as the claim generator originally intended, such as during fast-forward, rewind, or playback at a different speed, the validator may not be able to validate the content. In this case, the validator shall clearly signal to the user that the content cannot be validated during the corresponding operation.

For content with [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) with `box_purpose` set to `update` presence, the active manifest is first searched in the [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) with `box_purpose` set to `update` then in the [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) with `box_purpose` set to `original`. If the active manifest is in the [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) with `box_purpose` set to `update`, trace the ingredient parent chain (looking in either [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) with `box_purpose` set to `update` or `original` as needed) until the first non update manifest is found. The BMFF hash of this manifest content shall be validated in accordance with [Section 12.2.2, “Hard Bindings”](#_hard_bindings). The addition of an [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) with `box_purpose` set to `update` should not affect the hash calculation since it was added to the end of the file not changing any offsets.

If the `bmff-hash-map` does not contain an `exclusions` field or that field’s value is not of type array with at least one entry, then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`.

If the BMFF asset is fragmented and the `bmff-hash-map` contains both the `hash` and `merkle` fields, then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`.

If a validator encounters exclusion ranges other the required exclusions (as described in [Section A.5.5, “Exclusion List Requirements”](#_exclusion_list_requirements)), `free`, or `skip`, the informational code `assertion.bmffHash.additionalExclusionsPresent` shall be issued.

The validator shall ignore the presence and contents of `pad` and `pad2` fields.

Determine the hash algorithm identifier (or possible failure code) by following the procedure in [Section 14.4, “Determining the hashing algorithm”](#_determining_the_hashing_algorithm).

If the ending byte offset of one `subset` range (`offset` + `length`) is greater than the `offset` value of the next range in the array, or an `offset` or `length` value is negative, then the manifest shall be rejected with a failure code of `assertion.bmffHash.malformed`. The `assertion.bmffHash.mismatch` failure code is used for all other failures described in this section. Otherwise, the validator shall add the success code `assertion.bmffHash.match` to the list it eventually returns.

If the BMFF hashing process produces a `assertion.bmffHash.mismatch` failure code, then the validator shall look for presence of a [multi-asset hash assertion](#_multi_asset_hash). If one is present, the `assertion.bmffHash.mismatch` failure code shall not be issued, and instead the multi-asset hash assertion shall be validated as described in [Section 14.12.4, “Validating a multi-asset hash”](#validating_a_multi_asset_hash); otherwise, the manifest shall be rejected with a failure code of `assertion.bmffHash.mismatch`.

<a id="_non_fragmented_asset_using_merkle_tree"></a>
