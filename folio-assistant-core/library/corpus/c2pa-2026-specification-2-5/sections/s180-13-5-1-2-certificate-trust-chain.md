---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s180-13-5-1-2-certificate-trust-chain
section_title: "13.5.1.2. Certificate Trust Chain"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2422-2436
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 13.5.1.2. Certificate Trust Chain

When validating a certificate as the signing credential, if the certificate is present in the private credential store for X.509 certificates, the certificate is accepted. The private credential store is not consulted when validating time stamps.

If the certificate is not present in the private credential store, or the validator does not implement one, the trust chain shall be built and validated according to the procedure in [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 6 for the particular purpose required (signing, time stamping, or OCSP signing) and for the appropriate trust anchor store for that purpose. Any failure of that validation algorithm shall mean the chain shall be rejected. The private credential store is never included when building certificate chains; certificates in the private credential store cannot act as CAs.

A validator shall ensure a signing certificate is authorized for the purpose for which it is being used, and reject certificates used for an unauthorized purpose. A certificate is authorized for a particular purpose if the purpose’s EKU Object Identifier (OID) is present in the Extended Key Usage extension of the certificate ([RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.1.12).

When validating a certificate used to sign a C2PA Claim, the signing certificate shall have at least one of the EKUs for which the validator has an associated list of trust anchors (see [Section 13.4.1, “C2PA Signers”](#_c2pa_signers)), and the validator shall use only the trust anchors it associates with EKUs present in the certificate.

Except for certificates accepted through the private credential store for X.509 certificates, a validator shall verify a certificate’s compliance with the Certificate Profile, and reject certificates that do not comply. This includes requiring the presence of the Extended Key Usage extension, as well as a certificate being authorized for no more than one of the three purposes listed in this section: C2PA signing, time stamp signing, or OCSP response signing.

As described in the Certificate Profile, Certification Authority (CA) certificates are not required to have an EKU extension, and usually will not. If one is present, then the validator shall ignore it.

<a id="_certificate_revocation"></a>
