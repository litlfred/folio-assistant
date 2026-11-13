---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s010-1-5-claim-generators
section_title: "1.5. Claim Generators"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 111-179
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 1.5. Claim Generators

The core implementation flow for Claim Generators is to create assertions, reference them from a claim, include relevant ingredients, bind the claim to the asset, sign the claim, and package everything into a valid C2PA Manifest.

Examples of Claim Generators in the C2PA ecosystem include cameras, recorders, AI asset creators, asset editing software, and transcoders.

Must Read to Implement a Claim Generator

**[Technical Overview](#_technical_overview)**  
**Read:** All of this section.  
**Why:** Provides a basic mental model of how a C2PA Manifest is structured and why.

**[Glossary](#_glossary)**  
**Read:** Claim Generator, signer, validator, assertion, claim, C2PA Manifest, ingredient, hard binding, active manifest.  
**Why:** Lays the groundwork for understanding the terms used throughout the spec.

**[Assertions](#_assertions)**  
**Read:** All of this section.  
**Why:** Assertions are the statements a Claim Generator creates to signal something about an asset’s provenance, such as that it was captured by a camera, edited by software, or derived from another asset. Claim Generators need to understand how assertions are structured, referenced, and made tamper-evident.

**[Unique Identifiers](#_unique_identifiers)**  
**Read:** All of this section.  
**Why:** Explains how each C2PA Manifest is uniquely identified, using a C2PA URN. Claim Generators need this when creating new manifests and when preserving or importing ingredient manifests.

**[Binding to Content](#_binding_to_content)**  
**Read:** All of this section.  
**Why:** Generated C2PA Manifests need a hard binding: a cryptographic link between the asset and the C2PA Manifest. This section explains what constitutes a hard binding. It also explains how a C2PA Manifest may be discovered using a soft binding, such as a watermark, if the C2PA Manifest has been stripped from the asset.

**[Claims](#_claims)**  
**Read:** All of this section.  
**Why:** Claim Generators produce claims. A claim references the assertions being made about an asset and is the object that gets signed.

**[URI References](#_uri_references)**  
**Read:** All of this section.  
**Why:** Explains how claims and other C2PA Manifest components reference assertions, signatures, ingredients, and external resources. Claim Generators need to construct these references correctly and include hashes that allow validators to confirm integrity.

**[Manifests](#_manifests)**  
**Read:** All of this section.  
**Why:** Explains how claims, assertions, signatures, and supporting materials are packaged into a C2PA Manifest, how active manifests work, and how manifests are embedded within a file or externally referenced.

**[Embedding C2PA Manifests](#embedding_annex)**  
**Read:** Only the subsections for the asset formats the Claim Generator implementer supports.  
**Why:** When embedding a C2PA Manifest into an asset, the Claim Generator must place or reference the C2PA Manifest correctly for each asset format. This is where implementers find the practical file format rules.

**[C2PA Standard Assertions](#_c2pa_standard_assertions)**  
**Read:** Only the assertions the Claim Generator plans to emit.  
**Why:** This is the catalogue of standard assertions that a Claim Generator can emit. Implementers may only need to read about the assertions they plan to generate, not the full catalogue.

**[Cryptography](#_cryptography)**  
**Read:** All of this section.  
**Why:** Claim Generators only use permitted algorithms and produce signatures that validators can verify.

**[Trust Model](#_trust_model)**  
**Read:** Overview, Identity of Signers, X.509 Certificates.  
**Why:** Explains how signer identity, certificates, time stamps, and revocation information affect whether a signature can be trusted. Claim Generators need to understand this in order to produce signatures and credentials that validators can evaluate as valid and trusted.

Must Read Only If the Claim Generator Includes Live Media Assets

**[Live Media](#live-media)**  
**Read:** All of this section.  
**Why:** This section is only needed for Claim Generators handling live content, such as live video and audio assets, as well those using dynamic packaging.

Must Read Only If the Claim Generator Supports Ingredients

**[Validation](#validation-clause)**  
**Read:** All of this section.  
**Why:** Claim Generators that support ingredients must implement full validator behavior, since ingredients must be validated at the time of ingestion. Even Claim Generators that do not support ingredients can use this section as a QA checklist to understand how validators will evaluate their output.

<a id="_validators"></a>
