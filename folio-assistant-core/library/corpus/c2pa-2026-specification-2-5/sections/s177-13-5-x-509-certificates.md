---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s177-13-5-x-509-certificates
section_title: "13.5. X.509 Certificates"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2262-2295
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 13.5. X.509 Certificates

X.509 Certificates are stored as defined by [RFC 9360](https://www.rfc-editor.org/rfc/rfc9360) (_CBOR Object Signing and Encryption (COSE): Header Parameters for Carrying and Referencing X.509 Certificates_). For convenience, the definition of `x5chain` is copied below.

> **IMPORTANT:**
> This specification adds additional requirements beyond those of [RFC 9360](https://www.rfc-editor.org/rfc/rfc9360), which are listed after the quoted text. In particular, this specification requires all intermediate certificate authorities' certificates of the signer’s certificate chain to be included in the `x5chain` header, and requires claim generators to always place the `x5chain` header in the protected header bucket.

> x5chain: This header parameter contains an ordered array of X.509 certificates. The certificates are to be ordered starting with the certificate containing the end-entity key followed by the certificate that signed it, and so on. There is no requirement for the entire chain to be present in the element if there is reason to believe that the relying party already has, or can locate, the missing certificates. This means that the relying party is still required to do path building but that a candidate path is proposed in this header parameter.
> 
> The trust mechanism MUST process any certificates in this parameter as untrusted input. The presence of a self-signed certificate in the parameter MUST NOT cause the update of the set of trust anchors without some out-of-band confirmation. As the contents of this header parameter are untrusted input, the header parameter can be in either the protected or unprotected header bucket. Sending the header parameter in the unprotected header bucket allows an intermediary to remove or add certificates.
> 
> The end-entity certificate MUST be integrity protected by COSE. This can, for example, be done by sending the header parameter in the protected header, sending an 'x5chain' in the unprotected header combined with an 'x5t' in the protected header, or including the end-entity certificate in the external\_aad.
> 
> This header parameter allows for a single X.509 certificate or a chain of X.509 certificates to be carried in the message.
> 
> *   If a single certificate is conveyed, it is placed in a CBOR byte string.
>     
> *   If multiple certificates are conveyed, a CBOR array of byte strings is used, with each certificate being in its own byte string.
>     

The validator is only expected to have the certificates for its trust anchors. Therefore, when creating the `x5chain` header as part of signing, the claim generator shall include the signer’s certificate and all intermediate certificate authorities in the header’s value. The trust anchor’s certificate (also called the root certificate) should not be included.

The `subjectPublicKeyInfo` element of the first or only certificate will be the public key used to validate the signature. The `validity` element of the `tbsCertificate` sequence provides the time validity period of the certificate.

A previous version of this specification required claim generators to write the string label `x5chain` only to avoid the unlikely possibility that the integer label `33` would not be standardized.

Integer label `33` has now been standardized, and this specification now adopts it as standard, and deprecates use of the string label. Therefore:

*   Claim generators shall use only the integer `33` as the label when inserting this header into a COSE signature. Use of the string label `x5chain` is deprecated (see [Section H.2, “String Label `x5chain`”](#_string_label_x5chain)). Claim generators shall place this header only in the protected header bucket of the COSE signature as required above.
    
*   Validators shall accept either the string `x5chain` or the integer `33` as the label for this header. If both labels are present, this shall be treated as a single credential for the purpose of [Section 13.2, “Identity of Signers”](#_identity_of_signers); validators shall use the header with the integer label `33` and ignore the header with the string `x5chain` as the label. Validators shall accept the header from either the protected or unprotected bucket, to maintain compatibility with previous versions of this specification. In compliance with [Section 13.2, “Identity of Signers”](#_identity_of_signers), if this header appears in both the protected and unprotected buckets with the same label, a validator shall reject the claim signature as malformed due to the presence of multiple credentials.
    

<a id="_certificate_profiles"></a>
