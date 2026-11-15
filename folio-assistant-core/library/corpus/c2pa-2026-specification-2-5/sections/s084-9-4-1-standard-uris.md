---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s084-9-4-1-standard-uris
section_title: "9.4.1. Standard URIs"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1051-1062
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 9.4.1. Standard URIs

All references to information in the manifest, whether stored internally to the asset (i.e., embedded) or stored externally to the asset (e.g., in the cloud), shall be referenced via JUMBF URI references as defined in ISO 19566-5:2023, C.2. These URIs are normally used either as part of a `hashed_uri` or `hashed_ext_uri` data structure.

> **NOTE:**
> [Section 16.4.1.4.6, “Unique Identifiers for Actions”](#unique-identifiers-for-actions) describes an extension to standard JUMBF URIs to allow for the referencing of individual fields within a CBOR Content Type Box. This extension is only for use in that context, and is not a general extension to JUMBF URIs.

When the reference is to a [compressed manifest](#_compressed_manifests), the JUMBF URI shall not contain anything about the `brob` box, but the URI to the manifest is treated as if the manifest was not compressed. This means that the URI would include the label of the `c2ma` or `c2um` box, but not the label of the `c2cm` box. In addition, the URI reference to a compressed manifest shall not include the label of the `brob` box - but only the label of the compressed manifest itself.

When resolving an internal JUMBF URI reference, if any label in the path is ambiguous due to multiple child boxes having the same label, a validator shall treat the reference as unresolved.

<a id="_hashed_uris"></a>
