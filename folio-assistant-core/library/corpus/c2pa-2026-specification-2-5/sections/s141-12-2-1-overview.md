---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s141-12-2-1-overview
section_title: "12.2.1. Overview"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1874-1880
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.2.1. Overview

A key aspect to the [standard C2PA manifest](#_standard_manifests) is the presence of one or more data structures, called content bindings, that can uniquely identify portions of the asset. There are two types of bindings that are supported by C2PA - hard bindings and soft bindings. A hard binding (also known as a cryptographic binding) enables the validator to ensure that (a) this manifest belongs with this asset and (b) that the asset has not been modified, by determining values that can match only this asset and no other, not even other assets derived from it or renditions produced from it. A soft binding is computed from the [digital content](#_digital_content) of an asset, rather than its raw bits. A soft binding is useful for identifying derived assets and asset renditions.

A single manifest shall not contain more than one assertion defining a hard binding but may contain zero or more assertions defining soft bindings.

<a id="_hard_bindings"></a>
