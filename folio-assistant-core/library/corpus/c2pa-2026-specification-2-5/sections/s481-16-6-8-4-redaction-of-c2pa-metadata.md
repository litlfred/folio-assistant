---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s481-16-6-8-4-redaction-of-c2pa-metadata
section_title: "16.6.8.4. Redaction of `c2pa.metadata`"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9635-9641
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.8.4. Redaction of `c2pa.metadata`

Although the redaction process works in such a way that only an entire assertion could be redacted (see [Section 8.8, “Redaction of Assertions”](#_redaction_of_assertions)), the use of an [update manifest](#_update_manifests) enables partial redaction by removing the original and then placing the new, reduced, versions in the update manifest. This new assertion would be presented in a user experience in association with the signer of the update manifest and not with the signer of the C2PA Manifest that has been redacted.

For example, a metadata assertion containing both location data and camera information which needs to have the location data redacted could be done through an update manifest with a new metadata assertion containing only the camera information.

<a id="_trust_validation_adjuncts"></a>
