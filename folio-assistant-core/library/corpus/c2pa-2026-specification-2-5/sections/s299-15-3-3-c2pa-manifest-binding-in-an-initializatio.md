---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s299-15-3-3-c2pa-manifest-binding-in-an-initializatio
section_title: "15.3.3. C2PA Manifest binding in an initialization segment"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 4120-4127
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 15.3.3. C2PA Manifest binding in an initialization segment

For those use cases that require (or desire) the presence of an initialization segment, it shall contain a `uuid` box, whose `bmff-hash-map` includes the `moov` box to establish a cryptographic relationship between the initialization segment and the media segments. For the subset of live media streams that are in a broadcast 'push' streaming scenario (e.g., over-the-air broadcast television without a pull mechanism), the initialization segment may be repeated periodically, and the `uuid` box need not be included in each initialization segment, see [here](#exception-fmp4-manifest-init-seg).

> **NOTE:**
> The reason for this binding is to ensure that the C2PA Manifest corresponds to the specific media content, which prevents replay attacks and content substitution.

<a id="using_c2pa_manifest_box"></a>
