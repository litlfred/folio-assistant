---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s082-9-3-identifying-non-c2pa-assets
section_title: "9.3. Identifying Non-C2PA Assets"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1041-1047
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 9.3. Identifying Non-C2PA Assets

When working with assets that do not contain a C2PA Manifest, but the asset contains embedded XMP which include values for `xmpMM:DocumentID` and/or `xmpMM:InstanceID` as defined in [XMP Specification Part 2, 2.2](https://github.com/adobe/xmp-docs/blob/master/XMPNamespaces/XMPDataTypes/ResourceEvent.md), those values shall be used as identifiers for the asset.

When working with assets that do not contain a C2PA Manifest and do not contain embedded XMP, the claim generator may use any method of its choosing to provide it with a unique identifier.

<a id="_uri_references"></a>
