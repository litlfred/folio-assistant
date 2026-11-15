---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s156-12-3-1-signature-algorithms
section_title: "12.3.1. Signature Algorithms"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1985-2050
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.3.1. Signature Algorithms

The allowed list is:

*   ES256 (ECDSA with SHA-256);
    
*   ES384 (ECDSA with SHA-384);
    
*   ES512 (ECDSA with SHA-512);
    
*   ESP256 (ECDSA with SHA-256, fully-specified equivalent of `ES256`);
    
*   ESP384 (ECDSA with SHA-384, fully-specified equivalent of `ES384`);
    
*   ESP512 (ECDSA with SHA-512, fully-specified equivalent of `ES512`);
    
*   PS256 (RSASSA-PSS using SHA-256 and MGF1 with SHA-256);
    
*   PS384 (RSASSA-PSS using SHA-384 and MGF1 with SHA-384);
    
*   PS512 (RSASSA-PSS using SHA-512 and MGF1 with SHA-512);
    
*   EdDSA (Edwards-Curve DSA).
    
    *   Ed25519 instance only. No other EdDSA instances are allowed.
        
    
*   ML-DSA-44 (Module-Lattice-Based Digital Signature Algorithm, parameter set 44, COSE algorithm identifier `-48`);
    
*   ML-DSA-65 (Module-Lattice-Based Digital Signature Algorithm, parameter set 65, COSE algorithm identifier `-49`);
    
*   ML-DSA-87 (Module-Lattice-Based Digital Signature Algorithm, parameter set 87, COSE algorithm identifier `-50`).
    

The deprecated list is empty.

> **NOTE:**
> ML-DSA is a post-quantum digital signature algorithm standardized in [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) and registered for use with COSE in [RFC 9964](https://www.rfc-editor.org/rfc/rfc9964). ML-DSA signatures are substantially larger than those produced by the classical algorithms above: approximately 2420 bytes for ML-DSA-44, 3309 bytes for ML-DSA-65, and 4627 bytes for ML-DSA-87. Public keys are likewise larger (1312, 1952, and 2592 bytes respectively). Claim generators selecting an ML-DSA parameter set can weigh the resulting impact on C2PA Manifest size against the desired post-quantum security level.

> **NOTE:**
> `ESP256`, `ESP384`, and `ESP512` are "fully-specified" algorithm identifiers registered in [RFC 9864](https://www.rfc-editor.org/rfc/rfc9864). Unlike `ES256`, `ES384`, and `ES512`, which do not by themselves indicate a specific elliptic curve, `ESP256`, `ESP384`, and `ESP512` each unambiguously bind a hash algorithm to a single elliptic curve, matching the pairings required below: `ESP256` to P-256, `ESP384` to P-384, and `ESP512` to P-521. They are otherwise cryptographically equivalent to `ES256`, `ES384`, and `ES512` respectively.

> **NOTE:**
> This section identifies the algorithm used for the C2PA claim signature (the COSE signature). It does not limit or identify the algorithm used to sign X.509 certificates. The algorithm a Certificate Authority uses to sign a certificate (`signatureAlgorithm` in the certificate) is a separate matter governed by [Section 13.5.1.1, “General Requirements”](#certificate-requirements). A certificate signed by a CA using RSASSA-PKCS1-v1\_5 (`sha256WithRSAEncryption` and similar) is permitted to contain a public key whose corresponding private key signs C2PA claims using RSASSA-PSS, as required by this section.

Implementations shall check that keys provided for signing or verification operations are correct for the chosen algorithm, as required by [RFC 9053](https://www.rfc-editor.org/rfc/rfc9053), section 2.1 for ECDSA, [RFC 9053](https://www.rfc-editor.org/rfc/rfc9053), section 2.2 for EdDSA, [RFC 8230](https://www.rfc-editor.org/rfc/rfc8230), section 2 and section 4 for RSASSA-PSS, and [RFC 9964](https://www.rfc-editor.org/rfc/rfc9964), section 7.3 and section 7.4 for ML-DSA.

These requirements are summarized here for convenience:

*   ECDSA requires elliptic curve keys on the P-256, P-384, or P-521 elliptic curves.
    
    *   P-256 keys shall be used with `ES256` or `ESP256`, P-384 keys with `ES384` or `ESP384`, and P-521 keys with `ES512` or `ESP512`. Validators may reject other pairings of these curves with ECDSA algorithms.
        
    
*   Ed25519 requires elliptic curve keys on the edwards25519 elliptic curve.
    
*   RSASSA-PSS requires RSA keys with a modulus length of at least 2048 bits.
    
*   ML-DSA requires a key whose parameter set matches the chosen algorithm identifier: ML-DSA-44 keys with `-48`, ML-DSA-65 keys with `-49`, and ML-DSA-87 keys with `-50`.
    

Implementations shall refuse to generate or verify signatures with keys that are not correct for the algorithm choice. Implementations may refuse RSA keys with modulus length greater than 16384 bits.

For live media streaming implementations, which are addressed in [Chapter 15, _Live Media_](#live-media), deterministic signature algorithms should be used so that media segment caching is not negatively impacted. For example, workflows that implement [ISO/IEC 23009-9](https://www.iso.org/standard/85639.html) (REaP) or similar mechanisms would be negatively impacted if non-deterministic signatures were used as duplicate media content would be packaged in unique segments, reducing the effectiveness of segment caching.

<a id="_use_of_cose"></a>
