---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s131-11-7-multiple-step-processing
section_title: "11.7. Multiple Step Processing"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1739-1747
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 11.7. Multiple Step Processing

Some asset file formats require file offsets of the C2PA Manifest Store and asset content to be fixed before the manifest is signed, so that content bindings will correctly align with the content they authenticate. Unfortunately, the size of a manifest and its signature cannot be precisely known until after signing, which could cause file offsets to change.

As an example, in [JPEG 1](https://en.wikipedia.org/wiki/JPEG) files, the entire C2PA Manifest Store is required to appear in the file before the image data, and so its size will affect the file offsets of content being authenticated.

To accomplish this, a multiple step approach shall be taken, similar to how signatures in PDF are done.

<a id="_create_content_bindings"></a>
