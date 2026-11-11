---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s280-14-12-3-validating-a-general-box-hash
section_title: "14.12.3. Validating a general box hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3903-3929
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.12.3. Validating a general box hash

Once a standard manifest (and its bindings) has been located, the list of boxes to be validated shall be extracted from the `boxes` field of the `box-map` structure stored in the `c2pa.hash.boxes` assertion. If no such field is present, then the manifest shall be rejected with a failure code of `assertion.boxesHash.malformed`.

The boxes shall appear in the asset in the same order that they appear in the `boxes` array, including the box containing the C2PA Manifest. If there are any other boxes present in the asset, then the manifest shall be rejected with a failure code of `assertion.boxesHash.unknownBox`. If the boxes appear out of order, then the manifest shall be rejected with a failure code of `assertion.boxesHash.mismatch`.

The hash algorithm for each `box-hash-map` shall be determined by its `alg` field, or if that is not present, by the `alg` field in the containing `box-map`, or if that is not present, by the `alg` field in the Claim. If the hash algorithm is not specified in any of these places, or does not appear in the allowed or deprecated list in [Section 12.1, “Hashing”](#_hashing), then the manifest shall be rejected with a failure code of `algorithm.unsupported`.

Refer to `boxIndex` to determine which box the exclusion ranges indicated in the `exclusions` field correspond to. If the box indicated by `boxIndex` does not exist, the manifest shall be rejected with a failure code of `assertion.boxesHash.malformed`. The `start` that indicates the beginning of an exclusion range specifies an offset measured from the start of the box indicated by `boxIndex`. If the ending byte offset of one exclusion range (`start` + `length`) is greater than the starting byte offset of the next exclusion range in the array, or a `start` or `length` value is negative, then the manifest shall be rejected with a failure code of `assertion.boxesHash.malformed`.

The validator shall ignore the presence and contents of `pad` and `pad2` fields.

Follow the procedure in [Section 14.4, “Determining the hashing algorithm”](#_determining_the_hashing_algorithm) to determine the hash algorithm and any possible failure codes. The hash shall be computed over the bytes of the asset, except for the ranges specified in the `exclusions` field and any boxes where `excluded` field is `true`. If the end of an exclusion range falls beyond the end of the box that contains the exclusion range, then the manifest shall be rejected with a failure code of `assertion.boxesHash.mismatch`.

The combination of exclusion ranges and padding values, especially padding needed to support multi-pass processing workflows, may enable an attacker to replace parts of that padding with arbitrary data that could impact the consumption of the asset without invalidating the hash. For this reason a validator shall ensure that the data contained within the exclusion range including a C2PA Manifest Store consists only of the C2PA Manifest Store and appropriate padding (e.g., zero’d data) in clearly marked pad fields or free/skip boxes. Within other exclusion ranges than above C2PA Manifest Store, all or part of the asset metadata may also be included as described in [Section 12.2.2.9, “Binding Non-C2PA Asset Metadata”](#asset_metadata_bindings). If a validator encounters any data other than those permitted above, then the manifest shall be rejected with a failure code of `assertion.boxesHash.mismatch`. If a validator encounters exclusion ranges other than that for the C2PA Manifest Store and appropriate padding (e.g., zero’d data) in clearly marked pad fields or free/skip boxes, an informational code `assertion.boxesHash.additionalExclusionsPresent` shall be set.

If the hash value for any box does not match, and that box does not have an `excluded` field with a value of `true`, then the manifest shall be rejected with a failure code of `assertion.boxesHash.mismatch`.

If any `box-hash-map` in the `boxes` array does not contain a `names` field, then the manifest shall be rejected with a failure code of `assertion.boxesHash.malformed`.

For each box listed in the `names` and `boxes` array, the specified hash algorithm shall be computed over the bytes of the box (along with any associated header). If there are multiple entries in a `names` array, the hash value for that range of boxes shall be computed from the start of the first box (in the range) until the end of the last box (in the range). This would include any arbitrary bytes that may be present between boxes.

If the `hash` field is not present, or any resultant hash does not match the value of the `hash` field for those boxes, then the manifest shall be rejected with a failure code of `assertion.boxesHash.mismatch`. If the box hashing process produces a `assertion.boxesHash.mismatch` failure code, then the validator shall look for presence of a [multi-asset hash assertion](#_multi_asset_hash). If one is present, it shall be validated as described in [Section 14.12.4, “Validating a multi-asset hash”](#validating_a_multi_asset_hash), but if one is not present, the manifest shall be rejected with a failure code of `assertion.boxesHash.mismatch`.

Otherwise, the validator shall add the success code `assertion.boxesHash.match` to the list it eventually returns.

<a id="_jpeg_1_special_handling"></a>
