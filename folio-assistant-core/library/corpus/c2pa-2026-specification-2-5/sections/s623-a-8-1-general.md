---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s623-a-8-1-general
section_title: "A.8.1. General"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12001-12008
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.8.1. General

For unstructured text where traditional file-based embedding is not practical, such as content intended for copy-paste operations across different systems, C2PA Manifests may be embedded directly into a Unicode-encoded text stream. This method uses a sequence of Unicode Variation Selectors to encode a C2PA Manifest Store in a way that is not visually rendered, ensuring that Content Credentials persist with the content itself across platforms.

> **IMPORTANT:**
> This approach should only be used with unstructured text assets where no other embedding method is feasible. It remains under review and may be subject to change based on implementation feedback and interoperability testing.

<a id="_the_c2patextmanifestwrapper_structure"></a>
