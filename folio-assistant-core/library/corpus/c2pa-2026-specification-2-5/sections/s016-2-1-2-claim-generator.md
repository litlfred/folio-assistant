---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s016-2-1-2-claim-generator
section_title: "2.1.2. Claim generator"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 334-341
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 2.1.2. Claim generator

The non-human (hardware or software) [actor](#_actor) that generates the [claim](#_claim) about an [asset](#_asset) as well as the [claim signature](#claim-signature-definition), thus leading to the [asset](#_asset)'s associated [C2PA Manifest](#_c2pa_manifest).

> **NOTE:**
> The claim generator is a component of a larger system, such as a library, software development kit (SDK), or shared service that a signer relies on to generate and embed claims in assets, but is not the Signer itself and thus does not assume responsibility for the content of the Claim or Assertions.

<a id="signer-definition"></a>
