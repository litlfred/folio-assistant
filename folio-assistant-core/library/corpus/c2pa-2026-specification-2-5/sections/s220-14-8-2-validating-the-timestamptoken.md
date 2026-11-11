---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s220-14-8-2-validating-the-timestamptoken
section_title: "14.8.2. Validating the TimeStampToken"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2851-2889
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 14.8.2. Validating the TimeStampToken

All validators shall continue the process as follows:

*   If the signature algorithm in the `timeStampToken` is not on the allowed or deprecated list in [Section 12.3, “Digital Signatures”](#_digital_signatures), then the validator shall issue a `timeStamp.untrusted` informational code and ignore the time stamp.
    
*   Validate the signature in the `timeStampToken`, as described in [RFC 5652](https://www.rfc-editor.org/rfc/rfc5652), Section 5.6. If the signature is not valid, then the validator shall issue a `timeStamp.mismatch` informational code and ignore the time stamp.
    
*   If the `timeStampToken` does not contain a `messageImprint` field, the validator shall issue a `timeStamp.malformed` informational code and ignore the time stamp.
    
*   If the message imprint hash algorithm is not on the allowed or deprecated list in [Section 12.1, “Hashing”](#_hashing), then the validator shall issue a `timeStamp.untrusted` informational code and ignore the time stamp.
    
*   Validate that the value of the `messageImprint` field (in the `timeStampToken`), matches either the claim (v1, `sigTst`) or `COSE_Sign1_Tagged` structure’s `signature` field (v2, `sigTst2`) of the C2PA Manifest being validated, as described in [Section 10.3.2.5.2, “Choosing the Payload”](#_choosing_the_payload). If the values do not match, the validator shall issue a `timeStamp.mismatch` informational code and ignore the time stamp.
    
*   Validate that the `certificates` field of the `timeStampToken` is present, the TSA’s certificate can be found in the provided set of certificates in this field, and it is possible to build a trust chain from the TSA’s certificate to an entry in C2PA TSA Trust List (or other list of trust anchors present in the validator for this purpose). If the certificate cannot be located or a trust chain cannot be constructed, the validator shall issue a `timeStamp.untrusted` informational code and ignore the time stamp. If the validator determines that a certificate is invalid it may additionally return the informational code `timeStamp.credentialInvalid`.
    
*   Validate that the attested time, as found in the `genTime` field (in the `timeStampToken`), falls within the validity period of the TSA’s signing certificate and all CA certificates up to the trust anchor. If it does not, the validator shall issue a `timeStamp.outsideValidity` informational code and ignore the time stamp.
    
*   If the time stamp validation does not stop or fail due to any of the above conditions, then the validator shall issue the success codes of `timeStamp.trusted` and `timeStamp.validated`.
    
*   If the validator issued both `timeStamp.trusted` and `timeStamp.validated` success codes, then the validator shall validate that the time attested by the Time Stamping Authority (TSA), as found in the `genTime` field (in the `timeStampToken`), falls within the validity period of the claim signing certificate and all CA certificates up to the trust anchor. If this validation is successful, then the validator shall return a success code of `claimSignature.insideValidity`. If it is not successful, then the validator shall reject the claim with a `claimSignature.outsideValidity` failure code.
    

> **NOTE:**
> A time-stamp that fails one of the checks above does not necessarily (by itself) cause the C2PA Manifest to be rejected. Unlike time-stamp validation regimes such as [ETSI EN 319 102-1](https://www.etsi.org/deliver/etsi_en/319100_319199/31910201/01.04.01_60/en_31910201v010401p.pdf), section 5.6, where a time-stamp is a mandatory element of the claim being validated, a time-stamp in a C2PA Manifest is optional supplementary evidence: its only role is to let the validator substitute a trusted attested time for the current time when checking the validity period of the signing and time-stamping certificates (see [Chapter 13, _Trust Model_](#_trust_model)).
>
> Each such failure is still recorded via its informational code (e.g., `timeStamp.malformed`, `timeStamp.mismatch`, `timeStamp.untrusted`), so it appears in the validation results rather than being silently dropped. "Ignoring" the time-stamp means only that the validator proceeds as if no time-stamp were present, falling back to the current-time-based validity check described below.

> **NOTE:**
> Time stamps remain valid even after the signing credential of the time stamp authority expires, so long as the attested time falls within the time stamp authority’s certificate’s validity period. This is a special type of trust extended only to time stamp authorities.

At time of validation, when a time stamp is present, trusted, and validated, validators shall use the attested time, and not the current time, when determining the time validity of the signing certificate and the time stamp authority’s certificate.

> **NOTE:**
> This document does not require that the revocation status of a Time Stamping Authority’s certificate be captured at signing time nor validated at validation time.

If neither the `sigTst` nor the `sigTst2` headers are present, or if at least one of them is present but their time stamp token does not satisfy the above requirements, then the C2PA Manifest is valid if the current time at validation is within the validity period of the signer’s certificate and all CA certificates up to the trust anchor. If it is, the validator shall return a success code of `claimSignature.insideValidity`. If it is not, the C2PA Manifest shall be rejected with a failure code of `claimSignature.outsideValidity`.

<a id="_validating_the_claimed_time_of_signing"></a>
