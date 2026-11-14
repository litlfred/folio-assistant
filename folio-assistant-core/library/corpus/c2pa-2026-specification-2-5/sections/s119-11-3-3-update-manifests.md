---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s119-11-3-3-update-manifests
section_title: "11.3.3. Update Manifests"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1577-1606
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 11.3.3. Update Manifests

In a workflow where additional assertions need to be added to an existing C2PA Manifest, but no changes are made to the [digital content](#_digital_content) or other data covered by [content bindings](#_binding_to_content), an Update Manifest should be used.

An Update Manifest shall not contain assertions of types `c2pa.hash.data`, `c2pa.hash.boxes`, `c2pa.hash.collection.data`, `c2pa.hash.segment`, `c2pa.hash.bmff.v3`, or `c2pa.hash.multi-asset`, because the content has not changed and therefore the bindings need not be updated.

In cases where the existing content binding (e.g., a data hash) identifies the C2PA Manifest Store location using a file offset and length, the C2PA Manifest Store shall start at the same file offset after updating, but its length may change.

An Update Manifest may contain assertions of type `c2pa.actions` or `c2pa.actions.v2`, provided that the value of the `action` field of each action present in the `actions` array of these assertions shall only be one of the following values:

*   `c2pa.edited.metadata`
    
*   `c2pa.opened`
    
*   `c2pa.published`
    
*   `c2pa.redacted`
    

An Update Manifest shall not contain a [thumbnail assertion](#thumbnail_assertion).

> **NOTE:**
> The reason for these requirements is that an `action` field outside of this list or a thumbnail implies changes to the digital content.

The Update Manifest shall contain exactly one `c2pa.ingredient.v3` assertion that (a) includes both `activeManifest` and `claimSignature` fields with values that are the [URI references](#_uri_references) to the C2PA Manifest and Claim Signature respectively of the asset that is being updated and (b) has the value of `parentOf` for the `relationship` field.

> **NOTE:**
> The ingredient’s C2PA Manifest can be either a standard manifest or an update manifest.

<a id="_ingredient_storage"></a>
