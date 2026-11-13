---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s181-13-5-2-certificate-revocation
section_title: "13.5.2. Certificate Revocation"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2437-2461
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 13.5.2. Certificate Revocation

X.509 certificates support revocation status queries. A claim generator should use the Online Certificate Status Protocol (OCSP, [RFC 6960](https://www.rfc-editor.org/rfc/rfc6960)) and OCSP stapling (as originally conceptualized in [RFC 6066, Section 8](https://www.rfc-editor.org/rfc/rfc6066), but implemented as described in this clause) to implement revocation. The claim generator shall not use Certificate Revocation Lists (CRLs, [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)).

> **NOTE:**
> Using CRLs requires downloading the entire list of revoked certificates for each Certificate Authority encountered, which can be time-consuming. Although a CRL could be included in the same way an OCSP response is stapled, the potential size of a CRL relative to an OCSP response also makes this undesirable.

A conforming CA should include an AuthorityInfoAccess (AIA) extension ([RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), section 4.2.2.1) in their issued certificates to provide access information for the OCSP service operated by the CA.

If the certificate has an AIA extension, revocation information shall be stored in an unprotected header of the `COSE_Sign1` structure with the string label `rVals` and the value’s schema shall follow the `rVals` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.6.4, “Revocation Values (`rVals`)”](#cddl_annex_rvals) for the complete normative schema):

```cddl
; CBOR version of rVals and related structures based on JSON schema in
; https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/01.01.01_60/ts_11918201v010101p.pdf
; section 5.3.5.2
rVals = {
  "ocspVals": [1* bstr]
}
```

Before signing a claim, if a signer’s certificate has the AIA extension, a claim generator should query the OCSP service indicated therein, capture the response, and store it in an element of the `ocspVals` array of the `rVals` header. The claim generator should do the same for any intermediate CA certificates it includes with the claim signature.

The process for validating the revocation status of a certificate is described in [Validate the Credential Revocation Information](#_validate_the_credential_revocation_information).

<a id="validation-clause"></a>
