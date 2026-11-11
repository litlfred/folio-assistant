---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s165-13-2-identity-of-signers
section_title: "13.2. Identity of Signers"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2131-2142
source_sha256: ff401df19d1fde8c
granularity: heading
---
### 13.2. Identity of Signers

Identity in the trust model is the means by which a cryptographic signing key (aka credential) is associated with the signer for the basis of making trust decisions based on the claim signature or any structure (including, but not limited to, assertions and claims) signed with that key.

The credential shall be listed in the COSE protected headers of the `COSE_Sign1_Tagged` structure used for digital signatures in all C2PA manifests. Exactly one instance of an identity credential shall appear in the union of the protected and unprotected headers. `COSE_Sign1_Tagged` structures with no credentials, or two or more credentials, shall be rejected. Repeating the same credential more than once, including separately in the protected and unprotected headers, is also an instance of two or more credentials and shall be rejected. An exception is the case where the same X.509 certificate chain is present under both the string label `x5chain` and the integer label `33`, as described in [Section 13.5, “X.509 Certificates”](#x509_certificates); in that case the two labels shall be treated as a single credential.

> **NOTE:**
> Older versions of this specification also allowed the credential to appear in the COSE unprotected headers.

How the credential is stored in the header value, how trust chains are constructed are specified, and additional information can be found in [Section 13.5, “X.509 Certificates”](#x509_certificates).

<a id="_validation_states"></a>
