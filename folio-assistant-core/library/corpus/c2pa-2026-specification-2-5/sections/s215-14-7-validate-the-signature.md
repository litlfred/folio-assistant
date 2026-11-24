---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s215-14-7-validate-the-signature
section_title: "14.7. Validate the Signature"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2800-2816
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 14.7. Validate the Signature

The validator shall retrieve the URI reference for the signature from the value of the claim’s `signature` field and resolve the URI reference to obtain the COSE signature. If the `signature` field is not present, or the URI cannot be resolved, or the URI does not resolve to a location within the same C2PA Manifest box (as the claim), then the claim shall be rejected with a failure code of `claimSignature.missing`.

For all types of C2PA Manifests, the validation of the credential used in the signature shall be performed according to [Chapter 13, _Trust Model_](#_trust_model).

If the credential is not acceptable per [the requirements of the credential’s type](#x509_certificates), then the claim shall be rejected with a failure code of `signingCredential.invalid`. If the signature algorithm is not on the allowed or deprecated list in [Section 12.3, “Digital Signatures”](#_digital_signatures), then the claim shall be rejected with a failure code of `algorithm.unsupported`.

Before a chain of trust to a trust anchor is established, the validator shall first determine if a [valid time stamp](#_validate_the_time_stamp) is present. Then, a chain of trust should be verified from the credential to a trust anchor configuration in one of the applicable trust anchor lists. If a "notBefore" date/time is present in a trust anchor configuration, that configuration shall not validate claim signatures whose time stamp (or current time, if no time stamp is present) is before that date/time. If a "notAfter" date/time is present, that configuration shall not validate claim signatures whose time stamp (or current time, if no time stamp is present) is after that date/time.

If a chain of trust cannot be verified, the claim shall be rejected with a failure code of `signingCredential.untrusted`; otherwise, the claim signature shall be assigned a success code of `signingCredential.trusted`.

If the claim has not yet been rejected, validation shall proceed according to the specified procedure in [Section 12.3, “Digital Signatures”](#_digital_signatures). If validation of the signature fails, then the claim shall be rejected with a failure code of `claimSignature.mismatch`. Otherwise, the claim signature shall be assigned a success code of `claimSignature.validated`.

For the remainder of this chapter, headers refer to the union of the set of protected and unprotected header parameters in the COSE signature. Unless otherwise specified in [Section 12.3, “Digital Signatures”](#_digital_signatures) or [Section 13.5, “X.509 Certificates”](#x509_certificates), a header may appear in either bucket. COSE headers are described in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 3.

<a id="_validate_the_time_stamp"></a>
