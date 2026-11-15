---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s358-16-3-3-3-7-ogg-specific-handling
section_title: "16.3.3.3.7. Ogg-specific Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5483-5491
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.3.3.7. Ogg-specific Handling

In an Ogg file, the structure consists of one or more logical bitstreams, and the data for each stream is held in Ogg Pages. For the purpose of hashing, each logical bitstream is treated as a single 'box', which includes every Page, in order, with the same bitstream\_serial\_number. The C2PA Manifest Store 'box' is the logical bitstream identified in [Section A.3.7, “Embedding manifests into OGG Vorbis”](#_embedding_manifests_into_ogg_vorbis).

The box-name for each non-C2PA logical bitstream shall be a string constructed in the format: Stream-\[bitstream\_serial\_number\].

The bitstream\_serial\_number in the box name shall be the ASCII-encoded base-10 value of the 4-byte number for that stream, read as a 32-bit little-endian unsigned integer, found in its Ogg Page headers. For example, a logical bitstream with the bitstream\_serial\_number `\x01\x00\x00\x00` will have the box-name "Stream-1".

<a id="_schema_and_example_4"></a>
