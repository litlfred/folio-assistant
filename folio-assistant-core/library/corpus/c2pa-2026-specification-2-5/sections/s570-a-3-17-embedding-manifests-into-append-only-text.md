---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s570-a-3-17-embedding-manifests-into-append-only-text
section_title: "A.3.17. Embedding manifests into append-only text files"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11265-11269
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.17. Embedding manifests into append-only text files

Plain-text files are commonly written in an append-only fashion: new lines are added at the end and existing content is never modified. This section defines how to associate C2PA provenance with such files using a rolling chain of signed checkpoints. Each checkpoint covers a bounded segment of new content and is cryptographically linked to the previous checkpoint, enabling a validator to verify the complete history of the file.

<a id="_applicability"></a>
