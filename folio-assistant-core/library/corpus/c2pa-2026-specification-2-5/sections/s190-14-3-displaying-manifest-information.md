---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s190-14-3-displaying-manifest-information
section_title: "14.3. Displaying Manifest Information"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2581-2593
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 14.3. Displaying Manifest Information

Manifest Consumers should not display data from manifests which are not [Valid](#_valid_manifest) nor from assets which are not [Valid](#_asset_states). If the Manifest Consumer chooses to display such data, it shall include as part of the display:

*   a warning about the lack of validity,
    
*   a warning that the data shall not be attributed to the manifest’s signer, and in the case of an ingredient manifest, additional not to the asset’s manifest’s signer.
    

> **NOTE:**
> In authoring scenarios, it is desirable to more prominently raise warnings so that a creator can make an informed decision about how to proceed with an asset that is not Valid or that has a flawed provenance history .

<a id="_determining_the_hashing_algorithm"></a>
