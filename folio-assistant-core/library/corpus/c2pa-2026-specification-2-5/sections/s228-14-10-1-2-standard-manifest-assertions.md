---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s228-14-10-1-2-standard-manifest-assertions
section_title: "14.10.1.2. Standard Manifest Assertions"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2998-3011
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.10.1.2. Standard Manifest Assertions

If it is a [standard manifest](#_standard_manifests):

1.  Validate that there is exactly one [hard binding to content](#_binding_to_content) assertion - either a `c2pa.hash.data`, a `c2pa.hash.boxes`, a `c2pa.hash.collection.data`, a `c2pa.hash.segment`, `c2pa.hash.bmff.v2` (deprecated), or a `c2pa.hash.bmff.v3`. If no such assertion is present, the manifest shall be rejected with a failure code of `claim.hardBindings.missing`. If there is more than one such assertion, the manifest shall be rejected with a failure code of `assertion.multipleHardBindings`.
    
2.  Validate that there are zero or one `c2pa.ingredient` assertions whose `relationship` is `parentOf`. If there is more than one, the manifest shall be rejected with a failure code of `manifest.multipleParents`.
    
3.  Validate that at least one actions assertion is present in either `created_assertions` or `gathered_assertions`. If there is none, the manifest shall be rejected with a failure code of `claim.actions.missing`.
    
4.  Validate that a `c2pa.created` or `c2pa.opened` action is present in either the first actions assertion in `created_assertions` or the first actions assertion in `gathered_assertions`, and not both. If none is present, or if more than one is present, the manifest shall be rejected with a failure code of `assertion.action.malformed`.
    

<a id="_update_manifest_assertions"></a>
