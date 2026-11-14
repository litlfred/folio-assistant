---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s662-a-10-2-placement-of-the-manifest-store
section_title: "A.10.2. Placement of the Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12546-12569
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.10.2. Placement of the Manifest Store

The C2PA Manifest Store shall be stored as the block of a WARC record of a dedicated record type with the following header fields:

*   `WARC-Type`: `c2pa-provenance`
    
*   `Content-Type`: `application/c2pa`
    
*   `WARC-Date`: the time at which the manifest was created
    
*   `Content-Length`: the byte length of the C2PA Manifest Store
    

The remaining required and optional header fields (including `WARC-Record-ID`) shall conform to [ISO 28500:2017](https://www.iso.org/standard/68004.html). The C2PA manifest record shall not carry a `WARC-Target-URI`. Validators shall identify the C2PA manifest record by its `WARC-Type` value of `c2pa-provenance` together with its `Content-Type` value of `application/c2pa`. If a future revision of the WARC specification defines a record type for provenance, that type shall be used, and the value `c2pa-provenance` retained only for archives written under this provisional definition.

> **NOTE:**
> "C2PA manifest record" throughout this section means the WARC record carrying the C2PA Manifest Store, and is distinct from any manifest or index that a WARC toolchain maintains for the archive itself.

> **NOTE:**
> A dedicated record type is skipped by existing WARC indexers and replay systems, which prevents the C2PA Manifest Store from being indexed or replayed as if it were captured content. The type name `c2pa-provenance` is C2PA-scoped and provisional, and is raised with the WARC community at [iipc/warc-specifications#120](https://github.com/iipc/warc-specifications/issues/120).

The C2PA manifest record shall be the last record in the WARC file, appended after all other records. A WARC file shall contain at most one C2PA manifest record. To update the C2PA Manifest Store, a claim generator shall remove the existing C2PA manifest record, if present, and append the replacement as the new last record. Because the C2PA manifest record is always last, removing and re-appending it leaves the bytes, and therefore the hashes, of all other records unchanged.

<a id="warc_hashing"></a>
