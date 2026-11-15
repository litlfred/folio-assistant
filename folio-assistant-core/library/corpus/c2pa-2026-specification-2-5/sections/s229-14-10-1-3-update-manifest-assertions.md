---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s229-14-10-1-3-update-manifest-assertions
section_title: "14.10.1.3. Update Manifest Assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3012-3025
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.10.1.3. Update Manifest Assertions

If it is an [update manifest](#_update_manifests):

1.  Validate that exactly one ingredient assertion is present and that its `relationship` is `parentOf`. If there is not (i.e., either it is missing, there are more than one, or the value of `relationship` is not `parentOf`), the manifest shall be rejected with a failure code of `manifest.update.wrongParents`.
    
2.  Validate that there are no `c2pa.hash.data`, `c2pa.hash.boxes`, `c2pa.hash.collection.data`, `c2pa.hash.segment`, `c2pa.hash.bmff.v2` (deprecated), `c2pa.hash.bmff.v3`, or [thumbnail](#thumbnail_assertion) assertions. If there are, the manifest shall be rejected with a failure code of `manifest.update.invalid`.
    
3.  Validate that there are no `c2pa.hash.multi-asset` assertions. If there are, the manifest shall be rejected with a failure code of `manifest.update.invalid`.
    
4.  If there are one or more `c2pa.actions` or `c2pa.actions.v2` assertions, validate that the `action` field of each action found in the `actions` array of any such assertion is one of the supported values specified in [Update Manifests](#_update_manifests). If it is not, the manifest shall be rejected with a failure code of `manifest.update.invalid`.
    

<a id="_preparing_the_list_of_redacted_assertions"></a>
