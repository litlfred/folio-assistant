---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s123-11-5-2-compressed-manifests
section_title: "11.5.2. Compressed Manifests"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1649-1667
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 11.5.2. Compressed Manifests

Both [standard](#_standard_manifests) and [update](#_update_manifests) C2PA Manifests can be compressed, in their entirety. To support this, C2PA defines a new `brob` JUMBF content box, based on a similar box in JPEG-XL (ISO/IEC 18181-2:2024). The `brob` box shall have box ID of `0x62726F62` (`brob`).

For either type of manifest, the value of the `TYPE` field shall be `c2cm`, the value of the [label field](#jumbf_labels) shall be identical to the label of the compressed manifest superbox, and the contents of the `brob` content box shall be the [RFC 7932](https://www.rfc-editor.org/rfc/rfc7932) (Brotli-compressed) bytes of the entire manifest superbox. See [Figure 10, “Example of a compressed manifest”](#compressed_manifest_image) for an example of a compressed standard manifest.

![Example of compressed manifest](_images/brob_box.drawio.png)

Figure 10. Example of a compressed manifest

Hashing a compressed box is done in the same way as any other box, as described in [Section 9.4.2.3, “Hashing JUMBF Boxes”](#_hashing_jumbf_boxes).

> **NOTE:**
> This implies that given a `hashed_uri` reference from an ingredient assertion to a C2PA Manifest via the `activeManifest` field, the hash is computed using the same process as any other JUMBF superbox: over the JUMBF Description Box and the `brob` box with its compressed payload, but excluding the superbox’s header. The contents of the `brob` box are not decompressed first to compute the hash.

> **IMPORTANT:**
> Any place in this specification that a standard or update manifest is referenced, a compressed standard or update manifest is also valid.

<a id="_general_c2pa_jumbf_requirements"></a>
