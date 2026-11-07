---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s284-14-12-4-validating-a-multi-asset-hash
section_title: "14.12.4. Validating a multi-asset hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3949-3972
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.12.4. Validating a multi-asset hash

If the standard validation of the hard binding in the standard manifest fails, and the standard manifest contains a multi-asset hash assertion in `created_assertions`, then the validator shall proceed to validate the multi-asset hash assertion. If more than one multi-asset hash assertion is present, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.malformed`.

Validation of the multi-asset hash assertion (`c2pa.hash.multi-asset`) shall be performed by iterating over the array of `parts` in the `multi-asset-hash-map`. If the `parts` field is not present, or it is present with a value that is an empty array, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.malformed`.

For each part, the validator shall ensure that it contains both valid a `locator` and a valid `hashAssertion` field. If either of these are missing, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.malformed`.

If the locator is a `byte-offset-locator`, then the validator shall ensure that the `byteOffset` and `length` fields are present and non-negative. If these conditions are not met, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.malformed`.

If the locator is a `bmffBox`, then the validator shall ensure that the specified box is present in the asset. If the box is not present, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.malformed`.

Given a valid locator and hash, the validator shall attempt to locate the part using the locator information. If it is not present, and the `optional` field is either not present or present with a value of `false`, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.missingPart`. If the `optional` field is present with a value of `true`, then the validator shall skip over this part and continue with the next part.

> **NOTE:**
> Discarding certain parts may prevent a validator from being able to unambiguously identify the remaining parts. In most cases, only one or more parts at the end of the file, rather than any parts in the middle, can be discarded effectively.

If the located parts are overlapping or do not, in aggregate, cover every byte of the asset, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.malformed`.

For each located part, the validator shall compute the hash of the part using the specified algorithm & methodology (i.e., data hash, general box hash, or BMFF hash) over the bytes of the part. Any uses of absolute byte offsets in a part’s hash assertion (e.g., the `start` value in a data hash exclusion range) shall be interpreted relative to the beginning of that part. If the part is truncated (shorter than the length in the locator), or the resultant hash does not match the value present in the hard binding assertion referenced from the `hashAssertion` field, then the manifest shall be rejected with a failure code of `assertion.multiAssetHash.mismatch`.

If the hash assertion for each located part validates successfully, then the validator shall record the success code `assertion.multiAssetHash.match` and shall not record any failure codes associated with the asset’s hard binding.

<a id="_validating_a_collection_data_hash"></a>
