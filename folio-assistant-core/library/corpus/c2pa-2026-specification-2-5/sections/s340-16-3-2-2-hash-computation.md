---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s340-16-3-2-2-hash-computation
section_title: "16.3.2.2. Hash Computation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4756-4882
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.2.2. Hash Computation

The `alg` field, if present, shall be a string that is one of the allowed hash algorithms as defined in [Section 12.1, “Hashing”](#_hashing), and that algorithm shall be used to compute the hash. If the `alg` field is not present, then the hashing algorithm shall be determined by the value of the `alg` field in the Claim.

For a non-fragmented MP4 asset, the `hash` field, the `merkle` field, or both fields shall be present. For a fragmented MP4 asset validated using a Merkle tree, the `merkle` field shall be present and the `hash` field shall be absent. For live media segments used by any of the methods defined in [Chapter 15, _Live Media_](#live-media), the `hash` field shall be present and the `merkle` field shall be absent.

To compute the hash specified in the value field of a BMFF hash, all bytes of the file are added to the hash excluding those BMFF boxes or subset\[s\] thereof which match any exclusion entry in the `exclusions` array.

Boxes that are included in their entirety also include their box headers in the input data contributed to the hash. Similarly, boxes that are excluded in their entirety also exclude their box headers from the input data contributed to the hash. When a box is partially excluded from the input data contributed to the hash through the use of a `subset` field in the exclusion specification, the portion(s) of the box to be excluded defined by the relative byte offsets in the `subset` field are offsets from the start of the box including the box headers, not offsets from the start of the box’s content. These `subset` ranges shall be ordered by increasing `offset` value and shall not overlap.

In a `c2pa.hash.bmff.v2` (deprecated) and `c2pa.hash.bmff.v3` assertion, for any root box not excluded in its entirety, the input data contributed to the hash for that box is comprised of the concatenation of the binary strings `offset || data`, where `offset` is defined as the absolute file offset of the box as an 8-byte integer in big-endian format, and `data` is defined as the box’s contents, including headers, minus any exclusions. In this definition, "||" represents the binary concatenation of the two. The offset shall not be included for Merkle tree hashes when the bmff-hash-map includes both the `hash` and `merkle` fields.

In addition, `c2pa.hash.bmff.v2` (deprecated) and `c2pa.hash.bmff.v3` assertions include the following features:

*   The absolute file byte offset is included at the start of the input data contributed to the hash for any root box. This ensures that a root box included in the hash cannot change positions in the file.
    
*   The `mdat` box is no longer excluded in its entirety when the bmff-hash-map includes both the `hash` and `merkle` fields. Instead, a mandatory entry on the exclusion list excludes most of the box.
    

> **NOTE:**
> These two features ensure that the `mdat` cannot change positions in the file while also eliminating the need for the offset for each individual Merkle tree hash when the bmff-hash-map includes both the `hash` and `merkle` fields.

A box matches an exclusion entry in the `exclusions` array if and only if all of the following conditions are met:

*   The box’s location in the file matches the `exclusions-map` entry’s `xpath` field. For example, exclusion xpath `/foo/bar[2]` would match locations `/foo[3]/bar[2]` and `/foo[2]/bar[2]`, but not `/foo[3]/bar[1]` or `/foo[3]/bar[2]/baz[1]`.
    
*   If `length` is specified in the `exclusions-map` entry, the box’s length exactly matches the `exclusions-map` entry’s `length` field. Note: The length includes the box headers.
    
*   If `version` is specified in the `exclusions-map` entry, the box is a FullBox and the box’s version exactly matches the `exclusions-map` entry’s `version` field.
    
*   If `flags` (byte array of exactly 3 bytes) is specified in the `exclusions-map` entry and the box is a FullBox. If `exact` is set to true or not specified, the box’s flags (bit(24), i.e., 3 bytes) also exactly matches the `exclusions-map` entry’s `flags` field. If `exact` is set to false, the bitwise-and of the box’s flags (bit(24), i.e., 3 bytes) with the `exclusions-map` entry’s `flags` field exactly matches the `exclusions-map` entry’s `flags` field (i.e., the box has at least those bits set but may also have additional bits set).
    
*   If `data` (array of objects) is specified in the `exclusions-map` entry, then for each item in the array, the box’s binary data at that item’s relative byte `offset` field exactly matches that item’s `bytes` field.
    

The `xpath` field’s string syntax shall be limited to the following strict subset.

*   Only abbreviated syntax shall be used.
    
*   Only full paths shall be used.
    
*   Only node selection via `node` or `node[integer]` shall be used.
    
*   Descendent syntax, i.e., `//`, shall NOT be used.
    
*   All nodes shall be BMFF `4cc` codes.
    

Example 2. Complete Syntax for `xpath` Field

```none
  xpath = '/' nodes
  nodes = node
        | node '/' nodes
  node = box4cc
       | box4cc '[' integer ']'
Where:
  box4cc is any 4cc allowed by ISO/IEC 14496-12 for a BMFF box.
  integer is any non-zero positive integer with no leading zeros.
```

Any given exclusion entry may match zero or more boxes. It is not required that an exclusion entry match exactly one box.

A non-leaf xpath node shall only point to a container box that has no fields of its own (i.e., contains no data, only child boxes) and that does not inherit from FullBox. This ensures that a C2PA validator does not need to be aware of the syntax and semantics of unusual boxes that contain other boxes. If a child box of such an unusual box needs to be excluded in full or in part, the `exclusions-map` entry’s `xpath` field shall point to the unusual box itself and the `subset-map` field shall exclude the byte range(s) containing the excluded child box data. For example, the `'sgpd'` box contains other boxes but is unusual in that it inherits from FullBox; as such, if excluding child box(es), in whole or in part, from `'sgpd'` is required, the assertion shall use an `xpath` field pointing to the `'sgpd'` itself (e.g., `/moof/traf/sgpd`) and shall use the `subset-map` field to exclude the desired bytes.

If the C2PA Manifest is embedded into the file, the box containing it shall be one of the entries in the `exclusions` array. Refer to [Section A.5, “Embedding manifests into BMFF-based assets”](#_embedding_manifests_into_bmff_based_assets) for more information.

If a non-root excluded box is removed after the C2PA Manifest is created it shall be replaced with a `'free'` box of the same size to ensure that the input data contributed to the hash for other boxes are not invalidated. If C2PA Manifest store size is reduced by using compressed manifest after the C2PA Manifest is created, a `'free'` box shall be inserted in its place to ensure the offsets remain the same. If it is expected that a non-root excluded box may be added after the C2PA Manifest is created, then at manifest creation time, a `'free'` box shall be inserted with sufficient space for the excluded box and that `'free'` box shall also be excluded by an exclusion entry using its full xpath. When the excluded box is added or the C2PA Manifest store size is increased, the `'free'` box shall be shrunk (or removed) to compensate for the added data. However if there is insufficient space in the `'free'` box, a standard manifest shall be used.

Embedding C2PA data into a BMFF-based asset via MP4 boxes changes file offsets in other MP4 boxes as well as the absolute file byte offsets being included in the input data contributed to the hash for any root box. Those boxes and offsets shall be included in the input data contributed to the hash with their post-embed values, not their pre-embed values, or the BMFF-based hash assertion will not validate.

There are three possible ways an implementation can ensure that post-embed values for all file byte offsets are hashed:

1.  Use `'free'` boxes.
    
    1.  Determine reasonable maximum size(s) for the C2PA box(es) which will be embedded. All MP4 boxes for C2PA support unused padding bytes at the end, so it is fine to overestimate the size for the `'free'` boxes because any extra bytes will be ignored.
        
    2.  Insert `'free'` box(es) of said size(s) into the asset file(s) and update all offsets appropriately.
        
    3.  Perform hashing of the asset with "/free" on the exclusion list.
        
    4.  Create and sign the manifest. Create the C2PA box(es).
        
    5.  Overwrite the `'free'` box(es) with the C2PA box(es).
        
    
2.  Use a two-pass approach.
    
    1.  Compute the exact sizes of the BMFF-based hash assertion and the `merkle` box(es) if any. The latter will require parsing the asset file(s) to determine the size of the Merkle tree.
        
    2.  Compute the exact size of the final manifest.
        
    3.  Perform hashing of the asset file(s). Update any box that includes any file offsets to correct values before including that box in the input data contributed to the hash. Compute the input data contributed to the hash using `(offset || data)` using the updated absolute file offset as described above. As indicated above, the offset is not included in the data contributed for Merkle tree hashes when the bmff-hash-map includes both the `hash` and `merkle` fields.
        
    4.  Create and sign the manifest. Create the C2PA box(es).
        
    5.  Insert the C2PA box(es).
        
    
3.  Place Update Manifests at end of BMFF file.
    
    1.  Set original Manifest Store `box_purpose` from `manifest` to `original`.
        
    2.  Create and sign the Update Manifest.
        
    3.  Create Manifest Store with `box_purpose` `update`.
        
    4.  Insert signed Update Manifest into new Manifest Store with `box_purpose` `update` or append the Update Manifest if there is an existing Manifest Store with `box_purpose` `update`.
        
    5.  When present, the Manifest Store with box `box_purpose` `update` shall appear at the end of BMFF file.
        
    6.  If a standard manifest is later added when a Manifest Store with box `box_purpose` set to `update` is present, its contents shall be moved to the Manifest Store with box `box_purpose` `original`.
        
    7.  The update manifest store is then removed from the end of the file, allowing backward compatibility with a single manifest for common use-cases.
        
    8.  The Manifest Store with box `box_purpose` `original` shall be changed back to `box_purpose` `manifest` and the standard manifest shall be added as normal.
        
    

> **NOTE:**
> The `box_purpose` field is not included within the hash and can change without invalidating any existing hash. Likewise, appending the new [C2PA ContentProvenanceBox](#_embedding_manifests_into_bmff_based_assets) is not invalidating existing hashes.

While the two-pass approach method is significantly more complex, it does enable correct hashing without any foreknowledge of the maximum manifest size. It also minimizes the final asset’s size. Common boxes (**not** exhaustive) with file offsets include `'iloc'`, `'stco'`, `'co64'`, `'tfhd'`, `'sidx'`, and `'saio'`.

The option of placing updated Manifests at the end of the BMFF file allows updates when there is not a large enough `'free'` box or when the two-pass approach complexity is not desired. This option also supports chunk offsets in atom 'stco' boxes with partial data offset information.

<a id="_schema_and_example_3"></a>
