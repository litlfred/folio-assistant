---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s557-a-3-13-4-writing-a-manifest-store
section_title: "A.3.13.4. Writing a Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11132-11151
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.3.13.4. Writing a Manifest Store

To embed a C2PA Manifest Store:

1.  Construct the file with a placeholder `C2PA` extension block of the required reserved size.
    
2.  Compute the data hash over the complete file with the placeholder region excluded.
    
3.  Sign the manifest using the computed data hash.
    
4.  Replace the placeholder with the signed manifest (same byte length).
    

This follows the standard C2PA Manifest embeddable flow.

Only one `C2PA` block shall be present per file. If more than one `C2PA` block is encountered, the asset shall be treated as if no manifests were located.

Manifest consumers shall ignore extension block types they do not recognize.

<a id="_embedding_manifests_into_parquet"></a>
