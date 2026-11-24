---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s646-a-9-4-manifest-block-format
section_title: "A.9.4. Manifest Block Format"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12323-12332
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.9.4. Manifest Block Format

Where a file already contains a front matter section, the C2PA Manifest block shall appear inside it. For formats without front matter, or for files that lack a front matter section, the manifest block shall be expressed as a single comment line where the format supports comments. A claim generator shall not introduce a front matter section into a file that does not have one. In either case, the manifest block is delimited by the fixed ASCII Armour-style delimiters `-----BEGIN C2PA MANIFEST-----` and `-----END C2PA MANIFEST-----`, with the manifest reference/data appearing between them.

There shall be at most one manifest block per structured text file processed under this section. If a validator detects more than one, the asset shall be treated as if no manifests were located.

> **NOTE:**
> An append-only text file legitimately contains multiple sentinel lines, one per checkpoint, but those lines carry the `-----BEGIN C2PA CHECKPOINT-----` delimiters and are processed under [Section A.3.17, “Embedding manifests into append-only text files”](#_embedding_manifests_into_append_only_text_files), not this section. That section defines a different scan direction and hard binding model.

<a id="single-line-form"></a>
