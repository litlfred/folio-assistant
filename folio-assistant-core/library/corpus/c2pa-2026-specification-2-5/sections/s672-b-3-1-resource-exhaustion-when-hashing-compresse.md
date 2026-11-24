---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s672-b-3-1-resource-exhaustion-when-hashing-compresse
section_title: "B.3.1. Resource exhaustion when hashing compressed members"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12645-12654
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### B.3.1. Resource exhaustion when hashing compressed members

Where a hard binding is computed over the uncompressed bytes of a compressed asset member, a validator shall decompress attacker-supplied data before it can decide whether the asset is trustworthy. A member stored with a high compression ratio can expand to a size far larger than its stored form, so a small input can be made to consume unbounded memory or time during validation. This applies to any format whose members are hashed after decompression, including the per-record compression commonly used with WARC files (see [Section 14.12.5.3, “Hashing of WARC files”](#validating_a_warc_collection_hash)).

Two bounds contain this, and both are validator obligations applied before the signature has been evaluated. A validator shall enforce an implementation-defined maximum decompressed member size and reject any member exceeding it, which caps the work regardless of what the input claims. A validator shall also reject any member whose decompressed length disagrees with the length declared in its own metadata, which removes the case where a member decompresses to something other than what the container states it holds.

> **NOTE:**
> A conformant claim generator has no reason to emit an oversized member, so these checks exist specifically for adversarial input. Hashing uncompressed bytes remains desirable because it makes the binding survive recompression, and the bounds above are what make that safe.

<a id="_unicode_security_in_text_fields"></a>
