---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s603-a-5-5-exclusion-list-requirements
section_title: "A.5.5. Exclusion List Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11757-11793
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.5.5. Exclusion List Requirements

For all `c2pa.hash.bmff.v2` (deprecated) and `c2pa.hash.bmff.v3` assertions, the entries in [Example 20, “Always excluded boxes”](#always-excluded-boxes) shall always appear on the exclusion list. Other entries are allowed but not required.

The entire `'uuid'` C2PA box shall be excluded. (The `'data'` field is ensuring that other `'uuid'` boxes are not excluded.)

Example 20. Always excluded boxes

```none
xpath = "/uuid"
data = [ { offset = 8, data = b64'2P7D1hsOSDySl1goh37EgQ==' } ]
```

The entire `'mfra'` box shall be excluded. The `'ftyp'` box should not be excluded.

```none
xpath = "/mfra"
```

> **NOTE:**
> Previous versions of this specification included additional mandatory exclusions, but it was discovered that excluding them is insecure. In addition, previous versions of the spec included `'ftyp'` as a mandatory exclusion.

For all `c2pa.hash.bmff.v2` (deprecated) and `c2pa.hash.bmff.v3` assertions where the bmff-hash-map includes both the `hash` field and `merkle` fields, the entry in [Example 21, “Additional always excluded boxes”](#always-excluded-boxes-2) shall appear on the exclusion list.

Example 21. Additional always excluded boxes

```none
xpath = "/mdat"
subset = { { offset = 16, length = 0 } }
```

> **NOTE:**
> As indicated in the CDDL Definition above, the `c2pa.hash.bmff` assertion excludes the entire `'mdat'` box in this case, but it was discovered that excluding it is insecure.

As indicated in the CDDL Definition above, a relative byte offset or relative byte offset plus length that exceeds the length of the box is permitted; bytes beyond the end of the box shall never bed hashed. For example, if the `mdat` box is only 12 bytes long, all of it is hashed and the aforementioned mandatory exclusion entry has no effect although it is still required.

<a id="_timed_media_streams_that_are_neither_audio_nor_video"></a>
