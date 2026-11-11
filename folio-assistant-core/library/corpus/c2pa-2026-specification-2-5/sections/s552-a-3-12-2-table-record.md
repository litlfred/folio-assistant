---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s552-a-3-12-2-table-record
section_title: "A.3.12.2. Table Record"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11064-11082
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.12.2. Table Record

The C2PA table provides full support for a Manifest Stores to be either embedded or remote or both. The table record is defined as follows:

**Table 12. C2PA table record**

| Type | Name | Description |
| --- | --- | --- |
| `uint16` | `majorVersion` | Specifies the major version of the C2PA font table. |
| `uint16` | `minorVersion` | Specifies the minor version of the C2PA font table. |
| `Offset32` | `activeManifestUriOffset` | Offset from the beginning of the C2PA font table to the section containing a URI to the active manifest. If a URI is not provided a NULL offset = 0x0000 should be used. |
| `uint16` | `activeManifestUriLength` | Length of URI in bytes. |
| `uint16` | `reserved` | Reserved for future use. |
| `Offset32` | `manifestStoreOffset` | Offset from the beginning of the C2PA font table to the section containing a C2PA Manifest Store. If a Manifest Store is not provided a NULL offset = 0x0000 should be used. |
| `uint32` | `manifestStoreLength` | Length of the C2PA Manifest Store data in bytes. |

The non-embedded C2PA manifest may be remote or locally on the same storage system. If the reference is a JUMBF URI, it should be a valid reference within the C2PA Manifest Store.

<a id="_embedding_manifests_into_facti_facta_factv"></a>
