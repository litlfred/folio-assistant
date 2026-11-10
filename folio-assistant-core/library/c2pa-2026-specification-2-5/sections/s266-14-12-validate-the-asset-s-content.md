---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s266-14-12-validate-the-asset-s-content
section_title: "14.12. Validate the Asset’s Content"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3739-3745
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 14.12. Validate the Asset’s Content

The asset’s content shall be validated using the [hard binding](#_hard_bindings) in the active manifest if the active manifest is a standard manifest. If the active manifest is an update manifest, the hard binding shall be found in the `parentOf` ingredient’s manifest, or if that manifest is also an update manifest, by following the chain of `parentOf` ingredients to the first standard manifest. If no standard manifest is found, or the standard manifest has no hard binding in `created_assertions`, then the active manifest’s claim shall be rejected with a failure code of `claim.hardBindings.missing`.

An asset may also be composed of multiple parts, where each part has its own associated hash (see [Section 16.3.5, “Multi-Asset Hash”](#_multi_asset_hash)) which may be validated separately. For example, an asset may consist of separate static image & video parts, each of which can be validated separately.

<a id="_validating_a_data_hash"></a>
