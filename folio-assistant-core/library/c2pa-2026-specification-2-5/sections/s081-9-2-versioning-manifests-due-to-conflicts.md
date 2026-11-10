---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s081-9-2-versioning-manifests-due-to-conflicts
section_title: "9.2. Versioning Manifests Due to Conflicts"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1024-1040
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 9.2. Versioning Manifests Due to Conflicts

Situations may arise where it is necessary to re-label a C2PA Manifest due to a conflict of identifiers. For example, if a claim generator had already added an ingredient manifest into the asset’s C2PA Manifest Store, then later added another ingredient which had a manifest with the same label in its manifest store, but this latter version of the manifest was different due, for example, to a manipulation of one of its assertion values. In such a case, the modified version of the ingredient manifest needs to be copied into the asset’s C2PA Manifest Store, and shall be re-labeled.

To re-label a manifest:

*   If the current URN does not contain a "Claim Generator identifier string", then the claim generator shall append a `:`.
    
*   In all cases, the claim generator shall append a `:` to the URN followed by a monotonically increasing integer, starting with 1, followed by an underscore (`_`) and then an integer from the list below representing the reason for the re-labeling.
    
    *   1: Conflict with another C2PA Manifest
        
    

For example, if the claim generator has to re-label a C2PA Manifest for the second time due to a conflict, the appended string would be `:2_1`.

<a id="_identifying_non_c2pa_assets"></a>
