---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s349-16-3-3-1-description
section_title: "16.3.3.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5326-5361
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.3.1. Description

A claim generator should use a general box hash assertion to verify the integrity, with a [hard binding](#_hard_bindings) (i.e., cryptographic hash), of assets whose formats use a non-BMFF-based box format such as JPEG 1, PNG, or GIF.

A general box hash assertion shall have a label of `c2pa.hash.boxes`. Such an assertion consists of an array of structures, each one listing one or more boxes (by their name/identifier) and a hash that covers that data of those boxes (and any possible data that may be present in the file between them), along with the algorithm used for hashing. The boxes shall appear in the assertion in the same order that they appear in the asset, including the box containing the C2PA Manifest. If there are any other boxes present in the asset that are not explicitly included in this assertion, or if the boxes appear out of order, the manifest will be rejected during validation as described in [Section 14.12.3, “Validating a general box hash”](#_validating_a_general_box_hash).

A box may also have an `excluded` field, which is a boolean value indicating whether a validator can ignore this box (and associated hash) during validation. If this field is absent, or the field is present and its value is `false`, the box shall be hashed and the values compared. For boxes that have an `excluded` field with a value of `true`, the claim generator should include an accurate hash for compatibility with older validators that do not recognize the `excluded` field. If the claim generator is not concerned with backwards compatibility, it should write the binary string `00` (a single byte with a value of 0) for the hash.

A box may also include an `exclusions` field, which is an array of byte ranges to be excluded from the hash calculation. Each exclusion range shall be a map with `start` and `length` fields, indicating the byte offset (from the start of the box) and number of bytes to exclude. When multiple boxes exist in a `box-hash-map` structure, it is necessary to specify which box an exclusion range belongs to by using a `boxIndex` field. The first `boxIndex` in the `box-hash-map` structure is 0, 1 for the next, and so on. These ranges shall be ordered by increasing start offset and shall not overlap.

For box hash exclusion ranges, the range shall begin and end within one box and shall not overlap with any header or length field associated with that box, except for freebox or pad data. It is the responsibility of the claim generator to define exclusion ranges in a way that ensures that whatever data an attacker might place in those ranges cannot materially affect the interpretation of the asset. Furthermore, the claim generator shall ensure the exclusion range only contains content from C2PA Manifest Store, or asset metadata (e.g., EXIF, IPTC metadata). Example metadata that could be skipped can be unverified user name or image rotation information.

The `excluded` and `exclusions` fields serve different purposes. `excluded` is a boolean flag indicating that the entire box may be ignored during validation. `exclusions` is a list of byte ranges within the box that should be excluded from the hash calculation. If both fields are present, the `excluded` field is set to `true` takes precedence and the `exclusions` field shall be ignored. When the `excluded` field is set to `false` or the `excluded` field is absent, the `exclusions` field shall be applied.

In the case where there are multiple instances of the same box type, such as multiple `APP1` segments in a JPEG 1 file, each instance shall be listed separately in the assertion. JPEG segments that are fragments sharing the same segment identifier are also listed as separate boxes, with the exception of the segments comprising the C2PA Manifest Store (as described below).

The `alg` field in `box-hash-map`, if present, shall be a string that is one of the allowed hash algorithms as defined in [Section 12.1, “Hashing”](#_hashing), and that algorithm shall be used to compute the hash. If the `alg` field is not present in `box-hash-map`, then the hashing algorithm shall be determined by the value of the `alg` field in the containing `box-map`, or if that is not present, by the value of the `alg` field in the Claim.

The creation of the hashes is described in [Section 12.1, “Hashing”](#_hashing), and the value shall be present in the `hash` field. The hash value for a range of boxes shall be computed from the start of the first box (in the range) until the end of the last box (in the range). This would include any arbitrary bytes that may be present between boxes.

> **NOTE:**
> When using a range of boxes, all data between the start of the first box and the end of the last box is included in the hash. However, when listing each box separately, additional data is not included, only data within the listed box.

The box containing the C2PA Manifest Store (e.g. `caBX` for PNG, or `21FF` for GIF) shall also be listed in its own array. In order to clearly identify it as the C2PA Manifest box, it shall have the name `C2PA` and the value of `hash` shall be the binary string `00` (a single byte with a value of 0). The C2PA Manifest Store shall be represented as a single box, even in the case of a JPEG 1 file where the box is fragmented across multiple `APP11` marker segments.

> **NOTE:**
> As validators are often used in combination with output of file parsers, it is a security best practice to hash all of the file content outside of the C2PA Manifest Store. This will ensure the integrity of the media and the linked manifest.

The optional `pad` and `pad2` values, if present, shall be zero-filled byte strings.

> **NOTE:**
> [Section 11.7, “Multiple Step Processing”](#_multiple_step_processing) describes how to fill in the correct values and adjust the padding.

A General Box Hash assertion shall not appear in a [Cloud Data assertion](#_cloud_data) or a [External Reference assertion](#_external_reference).

<a id="_special_handling_of_multi_part_assets"></a>
