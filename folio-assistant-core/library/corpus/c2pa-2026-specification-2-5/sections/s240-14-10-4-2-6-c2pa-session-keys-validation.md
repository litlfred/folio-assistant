---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s240-14-10-4-2-6-c2pa-session-keys-validation
section_title: "14.10.4.2.6. `c2pa.session-keys` validation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3345-3349
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.4.2.6. `c2pa.session-keys` validation

If the assertion’s label is `c2pa.session-keys`, the validator shall ensure that the `signerBinding` signature is correct (which indicates that the session key private key is known to the Signer). This is done by verifying that the `signerBinding` signature successfully validates (using the session key), and that the payload of the signature is the Signer’s end-entity certificate . Session keys are only valid if the `signerBinding` signature is successfully validated.

<a id="_c2pa_time_stamp_validation"></a>
