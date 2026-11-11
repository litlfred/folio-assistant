---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s011-1-6-validators
section_title: "1.6. Validators"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 180-250
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 1.6. Validators

The core implementation flow for validators is to locate the C2PA Manifest Store, identify the active manifest, validate the claim and signature, check signer trust and credential status, validate assertions and ingredients, validate the asset’s content binding, and return or display validation results.

Examples of validators in the C2PA ecosystem include photo gallery applications, social media platforms, news publishers, and verification tools.

Must Read to Implement Validation

**[Technical Overview](#_technical_overview)**  
**Read:** All of this section.  
**Why:** Provides a basic mental model of how a C2PA Manifest is structured and why.

**[Glossary](#_glossary)**  
**Read:** Validator, Claim Generator, signer, assertion, claim, manifest consumer, C2PA Manifest, asset, editorial transformation, composed asset, hard binding, soft binding, active manifest, trust signals, C2PA Trust List.  
**Why:** Lays the groundwork for understanding the terms used throughout the spec.

**[Manifests](#_manifests)**  
**Read:** The sections on manifest packaging, manifest types, embedded manifests, and external manifests.  
**Why:** Helps validators understand the different types of C2PA Manifests, how a C2PA Manifest Store is structured, and how to identify the active C2PA Manifest.

**[Binding to Content](#_binding_to_content)**  
**Read:** The sections on hard bindings and soft bindings.  
**Why:** Validators need to understand how C2PA Manifests are bound to assets so they can determine whether a manifest belongs to the asset and whether the asset content has changed. Soft binding may also be useful for validators whose workflows include content matching or manifest recovery.

**[Cryptography](#_cryptography)**  
**Read:** The sections on hashing and digital signatures.  
**Why:** Outlines the permitted hash and signature algorithms needed to verify claims, signatures, time stamps, and content bindings correctly.

**[Trust Model](#_trust_model)**  
**Read:** The sections on trust-model overview, signer identity, validation states, trust lists, and X.509 certificates.  
**Why:** Explains how validators can tell whether a C2PA Manifest is well-formed, valid, and/or trusted, and how signer identity, certificates, trust lists, time stamps, and revocation information affect validation results.

**[Validation](#validation-clause)**  
**Read:** All of this section.  
**Why:** This is the core validator section. It provides instructions on how validators locate the active C2PA Manifest, validate the claim, verify the signature, validate time stamps and credential revocation information, validate assertions and ingredients, confirm the asset’s content binding, and return validation results.

**[C2PA Standard Assertions](#_c2pa_standard_assertions)**  
**Read:** All of this section.  
**Why:** Validators may encounter many standard assertions, but implementers generally only need to understand the assertion types their product handles.

Must Read Only If Displaying Validation Results to End Users

**[User Experience](#_user_experience)**  
**Read:** This section if the validator displays the information contained in a C2PA Manifest to users.  
**Why:** Validators that publish provenance, validation status, warnings, or trust signals need to do so without misleading users. This section also details current best practices.

Must Read Only If Validating Live Media Assets

**[Live Media](#live-media)**  
**Read:** This section only if the validator handles live content such as live video and audio.  
**Why:** Live content has additional validation considerations that do not apply to most validator implementations.

Helpful Context on C2PA Data Structures

**[Embedding C2PA Manifests](#embedding_annex)**  
**Read:** Only the subsections for the file formats the validator implementer directly parses.  
**Why:** Provides file format-specific information on where C2PA Manifests are embedded or referenced.

**[Assertions](#_assertions)**  
**Read:** The sections on assertion labels, versioning, multiple instances, assertion storage, and redaction.  
**Why:** Provides details on what data an assertion might contain, and how assertions can be packaged, stored, and redacted, helping validators parse and evaluate assertions.

**[Claims](#_claims)**  
**Read:** The overview and syntax sections.  
**Why:** Validators may want to understand how claims are structured as they determine whether a claim is valid.

**[URI References](#_uri_references)**  
**Read:** All of this section.  
**Why:** Explains how claims and other C2PA Manifest components point to assertions, signatures, ingredients, or external resources, and how hashed references help confirm that the referenced component is the intended one and has not changed, a key part of validation.

<a id="_security_reviewers"></a>
