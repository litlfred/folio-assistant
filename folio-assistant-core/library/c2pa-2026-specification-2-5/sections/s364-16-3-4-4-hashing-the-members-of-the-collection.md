---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s364-16-3-4-4-hashing-the-members-of-the-collection
section_title: "16.3.4.4. Hashing the members of the collection"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5917-5926
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.4.4. Hashing the members of the collection

Each file in the collection shall be hashed individually using the specific hash algorithm defined in the `alg` field. The resultant hash value shall be stored in the `hash` field of the `uri-hashed-data-map` associated with the `uri` to the file.

Not all files in a given hierarchy are required to be included in a hashed collection.

> **NOTE:**
> While this is useful in cases where there are files present that aren’t necessary to hash, it also provides an opening for an adversary to add files without invalidating the binding.

<a id="_multi_asset_hash"></a>
