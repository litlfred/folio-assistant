---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s273-14-12-1-3-3-partial-text-extraction
section_title: "14.12.1.3.3. Partial Text Extraction"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3828-3832
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.12.1.3.3. Partial Text Extraction

If unstructured text carrying a manifest is only partially copied, the `C2PATextManifestWrapper` may be truncated or absent. A truncated or absent wrapper cannot be decoded, so the asset is treated as if no manifests were located, consistent with the manifest store location procedure. A validator may indicate to the user that the content appears to be a fragment of a larger asset.

<a id="validating_a_structured_text_data_hash"></a>
