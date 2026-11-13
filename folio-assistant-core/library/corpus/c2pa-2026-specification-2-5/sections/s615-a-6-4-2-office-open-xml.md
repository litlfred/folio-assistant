---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s615-a-6-4-2-office-open-xml
section_title: "A.6.4.2. Office Open XML"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11897-11904
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.6.4.2. Office Open XML

OOXML’s digital signatures are based on [W3C XML DigSig Core](https://www.w3.org/TR/xmldsig-core1/), where each file that is signed is listed as a `<Reference>` element in the `<Manifest>` element of the `<Signature>` element. In addition, no support exists for signing the ZIP Central Directory. As such, OOXML native signing shall take place before the introduction of the C2PA Manifest.

> **NOTE:**
> OpenXPS is based on the same Open Packaging Convention (OPC) standard as OOXML, and as such, the same approach applies.

<a id="embedding_manifests_into_html"></a>
