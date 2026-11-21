---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s012-1-7-security-reviewers
section_title: "1.7. Security Reviewers"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 251-319
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 1.7. Security Reviewers

Security reviewers inspect the various specifications and guidance documents from the C2PA to determine whether the trust model, cryptographic algorithms, validation process, and security guidance meet current best practices.

Must Read to Review C2PA Security

**[Design Goals](#design-goals)**  
**Read:** All of this section.  
**Why:** Explains the security and provenance goals the C2PA specification is designed to support, including what the specification is intended to prove and what it is not intended to prove.

**[Technical Overview](#_technical_overview)**  
**Read:** All of this section.  
**Why:** Provides a basic mental model of how the C2PA specification is structured, including claims, assertions, manifests, signatures, ingredients, and validation.

**[Information Security Considerations](#_threats_and_security_considerations)**  
**Read:** All of this section.  
**Why:** This is the core security-review section. It outlines threats, harms, misuse and abuse scenarios, and other security considerations for reviewers to evaluate.

**[Trust Model](#_trust_model)**  
**Read:** All of this section.  
**Why:** Explains how the C2PA specification defines signer identity, validation states, trust lists, X.509 certificates, time stamps, and revocation information. Security reviewers need this section to understand the trust model and how trust decisions are scoped.

**[Cryptography](#_cryptography)**  
**Read:** All of this section.  
**Why:** Describes the permitted hash and signature algorithms. Security reviewers need this section to evaluate whether the cryptographic choices and requirements meet current best practices.

**[Validation](#validation-clause)**  
**Read:** All of this section.  
**Why:** Explains how validators locate the C2PA Manifest associated with an asset, verify signatures, validate time stamps and revocation information, validate assertions and ingredients, and confirm content bindings. Security reviewers need this section to evaluate whether validation behavior is complete, consistent, and resistant to misuse.

Helpful Context on C2PA Data Structures

**[Assertions](#_assertions)**  
**Read:** All of this section.  
**Why:** Helps reviewers understand how assertions are structured, referenced, stored, versioned, and redacted, which is important for reviewing integrity, privacy, and tamper-resistance properties.

**[Binding to Content](#_binding_to_content)**  
**Read:** All of this section.  
**Why:** Explains hard bindings and soft bindings. Security reviewers need this context to evaluate how well the C2PA specification ties provenance metadata to assets and what risks remain when assets are modified, transformed, stripped, or matched through soft-binding workflows.

**[Claims](#_claims)**  
**Read:** All of this section.  
**Why:** Helps reviewers understand what is signed, how assertions are referenced by a claim, and how claims function as the core integrity-protected statement in a C2PA Manifest.

**[Manifests](#_manifests)**  
**Read:** All of this section.  
**Why:** Explains how claims, assertions, signatures, and supporting materials are packaged, embedded, externally referenced, and organized into an active C2PA Manifest. Security reviewers need this context to evaluate C2PA Manifest integrity, ambiguity, stripping, and substitution risks.

**[Embedding C2PA Manifests](#embedding_annex)**  
**Read:** Only the asset formats relevant to the review.  
**Why:** File format embedding rules may affect C2PA Manifest discovery, stripping, replacement, ambiguity, and content-binding behavior.

**[C2PA Standard Assertions](#_c2pa_standard_assertions)**  
**Read:** The assertions relevant to the reviewer’s threat model.  
**Why:** The standard assertion catalogue defines the information that an implementation of the C2PA specification are required to emit & validate, as well as rules for the creation of custom assertions. Security reviewers may need to inspect specific assertions, such as content hash, actions, ingredients, metadata, time stamps, certificate status, external references, and AI disclosure.

Must Read Only If Reviewing User-Facing Trust Signals

**[User Experience](#_user_experience)**  
**Read:** This section if reviewing user-facing trust signals or display requirements.  
**Why:** Security claims can be undermined by misleading presentation. Reviewers should assess whether provenance, validation status, warnings, and trust indicators are presented in a way that avoids overstatement.

Must Read Only If Reviewing Live Media Workflows

**[Live Media](#live-media)**  
**Read:** This section only if reviewing live content workflows, such as live video and audio, or workflows that use dynamic packaging.  
**Why:** Live content introduces additional validation, continuity, segment, session-key, and timing considerations that do not apply to static asset workflows.

<a id="_glossary"></a>
