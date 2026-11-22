---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s620-a-7-1-3-hard-binding
section_title: "A.7.1.3. Hard Binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11968-11979
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.7.1.3. Hard Binding

A claim generator embedding a C2PA Manifest Store in an HTML document shall include a [`c2pa.hash.data`](#_data_hash) assertion.

For an embedded `script` element, the data hash assertion shall include a single exclusion range covering the entire element from the opening `<script` tag through the closing `</script>` tag, inclusive. The hash shall be computed over the document content with the exclusion range removed.

For an external `link` element, the manifest is not embedded in the document. The data hash assertion shall have no exclusion range; the hash shall be computed over the entire document.

> **NOTE:**
> The hash is defined over the byte representation of the document as stored. Any process that re-serializes the HTML (e.g., a CMS, CDN, or HTML formatter that normalizes whitespace, reorders attributes, or changes quote styles) will alter byte offsets and invalidate the content binding. This is by design: re-serialization is a content modification, and the hash should reflect that the document has changed. Claim generators operating in pipelines that re-serialize HTML should embed the manifest after the final serialization step, or use an [external manifest](#_external_manifests) before final manifest generation.

<a id="_validator_behaviour"></a>
