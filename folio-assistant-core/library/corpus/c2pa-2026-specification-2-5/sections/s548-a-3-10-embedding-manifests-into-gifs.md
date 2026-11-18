---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s548-a-3-10-embedding-manifests-into-gifs
section_title: "A.3.10. Embedding manifests into GIFs"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11022-11042
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.10. Embedding manifests into GIFs

The C2PA Manifest Store shall be broken into chunks of a size no greater than 255 bytes and embedded into contiguous data sub-blocks (as per [GIF](https://www.w3.org/Graphics/GIF/spec-gif89a.txt), 15) within a C2PA-specialised Application Extension block (as per [GIF](https://www.w3.org/Graphics/GIF/spec-gif89a.txt), 26), specified below.

> **NOTE:**
> In this C2PA Application Extension Block, the Application Authentication Code is not used to authenticate the application producing the block. Instead, it is used as a block version, and set initially at major version 1, minor version 0, and is encoded as specified below.

```none
Extension Introducer: 0x21
Application Extension Label: 0xFF
Block Size: 0xB
Application Identifier: 0x43, 0x32, 0x50, 0x41, 0x5F, 0x47, 0x49, 0x46 (“C2PA_GIF”)
Application Authentication Code: 0x010000 (0x[MajorVersion][MinorVersion]00)
Application Data: The C2PA Manifest Store, encoded as a series of data sub-blocks, each containing 1 byte size followed by up to 255 bytes of data
Block Terminator: 0x00 (added after the last data sub-block of the C2PA Manifest Store)
Quantity: One
```

This block shall be embedded after the header and prior to the first image descriptor box.

<a id="_embedding_manifests_into_jpeg_xl"></a>
