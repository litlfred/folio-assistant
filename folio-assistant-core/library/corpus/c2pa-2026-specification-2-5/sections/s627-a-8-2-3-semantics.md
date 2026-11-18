---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s627-a-8-2-3-semantics
section_title: "A.8.2.3. Semantics"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12042-12064
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.8.2.3. Semantics

magic

The identifier for C2PA text manifests, always `C2PATXT\0` (0x4332504154585400).

version

Version of this text embedding specification (currently 1).

manifestLength

The length in bytes of the JUMBF container, encoded as a big-endian unsigned integer.

jumbfContainer

The raw bytes of the C2PA Manifest Store in JUMBF format.

padding

Zero or more bytes appended after the JUMBF container. These bytes carry no semantic meaning and shall be ignored during decoding. Padding enables deterministic wrapper byte length (see [Section A.8.5, “Deterministic Wrapper Padding”](#deterministic_wrapper_padding)).

<a id="_encoding_and_decoding_algorithms"></a>
