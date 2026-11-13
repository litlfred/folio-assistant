---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s179-13-5-1-1-general-requirements
section_title: "13.5.1.1. General Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2299-2421
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 13.5.1.1. General Requirements

This section defines the requirements to validate that an X.509 certificate is acceptable as a signing credential as described in [Section 14.7, “Validate the Signature”](#_validate_the_signature).

All C2PA Claim signing certificates shall fulfill the following requirements. The requirements do not apply to TSA, OCSP or CA certificates in certificate chains.

> **NOTE:**
> The `signatureAlgorithm` field identifies the algorithm the issuing Certificate Authority (CA) used to sign the certificate itself. This is distinct from the algorithm used for the C2PA claim signature, which is governed by [Section 12.3.1, “Signature Algorithms”](#_signature_algorithms). RSASSA-PKCS1-v1\_5 algorithms (`sha256WithRSAEncryption` and similar) are permitted here as CA certificate signature algorithms but are not permitted for signing C2PA claims.

*   The `algorithm` field of the `signatureAlgorithm` field shall be one of the following values:
    
    `ecdsa-with-SHA256`
    
    [RFC 5758, section 3.2](https://www.rfc-editor.org/rfc/rfc5758#section-3.2)
    
    `ecdsa-with-SHA384`
    
    [RFC 5758, section 3.2](https://www.rfc-editor.org/rfc/rfc5758#section-3.2)
    
    `ecdsa-with-SHA512`
    
    [RFC 5758, section 3.2](https://www.rfc-editor.org/rfc/rfc5758#section-3.2)
    
    `sha256WithRSAEncryption`
    
    [RFC 8017, appendix A.2.4](https://www.rfc-editor.org/rfc/rfc8017#appendix-A.2.4)
    
    `sha384WithRSAEncryption`
    
    [RFC 8017, appendix A.2.4](https://www.rfc-editor.org/rfc/rfc8017#appendix-A.2.4)
    
    `sha512WithRSAEncryption`
    
    [RFC 8017, appendix A.2.4](https://www.rfc-editor.org/rfc/rfc8017#appendix-A.2.4)
    
    `id-RSASSA-PSS`
    
    [RFC 8017, appendix A.2.3](https://www.rfc-editor.org/rfc/rfc8017#appendix-A.2.3)
    
    `id-Ed25519`
    
    [RFC 8410](https://www.rfc-editor.org/rfc/rfc8410), section 3
    
    `id-ml-dsa-44`
    
    [RFC 9881](https://www.rfc-editor.org/rfc/rfc9881), section 3
    
    `id-ml-dsa-65`
    
    [RFC 9881](https://www.rfc-editor.org/rfc/rfc9881), section 3
    
    `id-ml-dsa-87`
    
    [RFC 9881](https://www.rfc-editor.org/rfc/rfc9881), section 3
    
*   If the `algorithm` field of the `signatureAlgorithm` field is `id-RSASSA-PSS`, the `parameters` field is of type `RSASSA-PSS-params`. Its fields shall have the following requirements as defined in [RFC 8017, appendix A.2.3](https://www.rfc-editor.org/rfc/rfc8017#appendix-A.2.3):
    
    *   The `hashAlgorithm` field shall be present.
        
    *   The `algorithm` field of the `hashAlgorithm` field shall be one of the following values as defined in [RFC 8017, appendix B.1](https://www.rfc-editor.org/rfc/rfc8017#appendix-B.1):
        
        *   `id-sha256`.
            
        *   `id-sha384`.
            
        *   `id-sha512`.
            
        
    *   The `maskGenAlgorithm` field shall be present.
        
    *   The `algorithm` field of the `parameters` field of the `maskGenAlgorithm` field shall be equal to the `algorithm` field of the `hashAlgorithm` field.
        
    
*   If the `algorithm` field of the `signatureAlgorithm` field is `id-ml-dsa-44`, `id-ml-dsa-65`, or `id-ml-dsa-87`, the `parameters` field shall be absent, as required by [RFC 9881](https://www.rfc-editor.org/rfc/rfc9881), section 3.
    
*   If the `algorithm` field of the `algorithm` field of the certificate’s `subjectPublicKeyInfo` is `id-ecPublicKey`, the `parameters` field shall be one of the following named curves from [RFC 5480, section 2.1.1.1](https://www.rfc-editor.org/rfc/rfc5480#section-2.1.1.1):
    
    *   `prime256v1`.
        
    *   `secp384r1`.
        
    *   `secp521r1`.
        
    
*   If the `algorithm` field of the `algorithm` field of the certificate’s `subjectPublicKeyInfo` is `rsaEncryption` or `id-RSASSA-PSS`, the `modulus` field of the `parameters` field shall have a length of at least 2048 bits.
    
*   If the `algorithm` field of the `algorithm` field of the certificate’s `subjectPublicKeyInfo` is `id-ml-dsa-44`, `id-ml-dsa-65`, or `id-ml-dsa-87`, the `parameters` field shall be absent, and the `subjectPublicKey` field shall contain an ML-DSA public key encoded as defined in [RFC 9881](https://www.rfc-editor.org/rfc/rfc9881), section 4.
    

All certificates except those in the private credential store for X.509 certificates shall fulfil the following additional requirements to be acceptable.

*   Version shall be `v3` as per [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.1.2.1.
    
*   The `issuerUniqueID` and `subjectUniqueID` optional fields of the `TBSCertificate` sequence shall not be present, as per [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.1.2.8.
    
*   The Basic Constraints extension shall follow [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.1.9. In particular, one of the following shall be true:
    
    *   If the certified public key is used to sign certificates, the Basic Constraints extension shall be present with the `cA` boolean asserted.
        
    *   If the certified public key is used to sign C2PA Claims, time stamps, or OCSP responses, the `cA` boolean in the Basic Constraints extension shall not be asserted, and the `keyCertSign` boolean in the key usage extension shall not be asserted. Only end entity certificates shall be used to sign C2PA Claims, time stamps, and OCSP responses.
        
    
*   The Authority Key Identifier extension shall be present in any certificate that is not self-signed, as per [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.1.1.
    
*   As prescribed in [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.1.2, the Subject Key Identifier extension shall be present in any certificate that acts as a CA. It should be present in end entity certificates.
    
*   As prescribed in [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.1.3, the Key Usage extension shall be present and should be marked as critical. Certificates used to sign C2PA manifests shall assert the `digitalSignature` bit. The `keyCertSign` bit shall only be asserted if the `cA` boolean is asserted in the Basic Constraints extension.
    
*   The Extended Key Usage (EKU) extension shall be present and non-empty in any certificate where the Basic Constraints extension is absent or the `cA` boolean is not asserted, as per [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.1.12. These are commonly called "end entity" or "leaf" certificates.
    
    *   The `anyExtendedKeyUsage` EKU (2.5.29.37.0) shall not be present.
        
    *   A certificate that signs time stamp countersignatures shall be valid for the `id-kp-timeStamping` (1.3.6.1.5.5.7.3.8) purpose.
        
    *   A certificate that signs OCSP responses for certificates shall be valid for the `id-kp-OCSPSigning` (1.3.6.1.5.5.7.3.9) purpose.
        
    *   If a certificate is valid for either `id-kp-timeStamping` or `id-kp-OCSPSigning`, it shall be valid for exactly one of those two purposes, and not valid for any other purpose.
        
    *   A certificate should not be valid for any other purposes outside of the purposes listed above, but the presence of any EKUs not mentioned in this profile and not in the list of EKUs in the configuration store shall not cause the certificate to be rejected.
        
    

<a id="_certificate_trust_chain"></a>
