---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s621-a-7-1-4-validator-behaviour
section_title: "A.7.1.4. Validator Behaviour"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11980-11997
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.7.1.4. Validator Behaviour

A validator encountering an HTML document (`text/html`) shall perform the following steps:

1.  Treating the file as a series of bytes (vs. text), the validator shall parse the `head` element, searching for a `script` element with `type="application/c2pa"` or a `link` element with `rel="c2pa-manifest"`.
    
2.  If multiple matching elements are found, the document shall be treated as if no manifests were located.
    
3.  If no matching element is found, the document does not contain an HTML-embedded manifest.
    
4.  If a `script` element is found, Base64-decode its content to obtain the C2PA Manifest Store.
    
5.  If a `link` element is found, resolution of the external URI is optional. If the validator resolves it, it should follow the procedures in [Section 14.5.3, “By Reference or URI”](#manifests-by-reference).
    
6.  Once a C2PA Manifest Store is obtained, the validator shall validate it as per the normal validation process described in [Locating and Validating the Claim](#validating_the_claim).
    

<a id="embedding_manifests_into_unstructured_text"></a>
