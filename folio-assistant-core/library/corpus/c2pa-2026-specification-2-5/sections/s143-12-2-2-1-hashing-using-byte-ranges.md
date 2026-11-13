---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s143-12-2-2-1-hashing-using-byte-ranges
section_title: "12.2.2.1. Hashing using byte ranges"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1886-1892
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.1. Hashing using byte ranges

The simplest type of hard binding that can be used to detect tampering is a cryptographic hashing algorithm, as described in [Section 12.1, “Hashing”](#_hashing), over some or all of the bytes of an asset. This approach can be used on any type of asset, but should only be considered for formats that don’t support one of the forms of box-based hashing.

When using this form of hard binding, a [data hash assertion](#_data_hash) is used to define the range of bytes that are hashed (and those that are not). Because a data hash assertion defines a byte range, it is flexible enough to be usable whether the asset is a single binary or represented in multiple chunks or portions. For live media contributed over [Enhanced RTMP (V2)](https://veovera.org/docs/enhanced/enhanced-rtmp-v2.html), a data hash assertion is used to bind a C2PA Manifest to the stream’s codec configuration, as described in [Section 15.5.3.3, “Initialization data binding”](#ertmp_init_binding).

<a id="_hashing_using_a_general_box_hash"></a>
