---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s379-16-3-7-5-soft-binding-resolution-api
section_title: "16.3.7.5. Soft Binding Resolution API"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6563-6569
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.3.7.5. Soft Binding Resolution API

The soft binding resolution API is a Web API providing a standard way of retrieving C2PA Manifest stores from a soft binding resolution API endpoint given a soft binding value, a manifest identifier, or an asset. The soft binding algorithm list entry may contain a list of URIs of soft binding resolution APIs in the `softBindingResolutionApis` field. If several URIs are given then any may be used for a soft binding resolution.

The API specification and documentation is available [here](../softbinding/Decoupled.html.md#SBR-API).

<a id="_validating_soft_binding_matches"></a>
