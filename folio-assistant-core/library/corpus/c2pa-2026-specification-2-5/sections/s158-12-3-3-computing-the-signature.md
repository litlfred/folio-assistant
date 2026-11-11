---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s158-12-3-3-computing-the-signature
section_title: "12.3.3. Computing the Signature"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2063-2089
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 12.3.3. Computing the Signature

The signature is computed or verified as described in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 4.4. The following additional requirements apply to the construction of `Sig_structure`:

*   The value for the `context` element shall be `Signature1` except where a particular use of digital signatures in this specification specifies using `CounterSignature` instead. `Signature` shall not be used.
    
*   The value for the `payload` element will be specified by each use of digital signatures in this specification.
    
*   The `external_aad` element shall be a `bstr` of length zero. External authenticated data shall not be used.
    
*   The `alg` header specifying the signature algorithm shall be present in the `body_protected` element as defined in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 3.1.
    
    > **NOTE:**
    > The `alg` header is a standard COSE header, and therefore is always included in the protected header map with the integer `1` as its label, as established in the [IANA COSE Header Parameters Registry](https://www.iana.org/assignments/cose/cose.xhtml#header-parameters). The literal string `alg` is never used as the label. The `sign_protected` element is always omitted when using `COSE_Sign1`.
    

All digital signatures in C2PA structures shall be a `COSE_Sign1_Tagged` structure as defined in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 4.2. `COSE_Sign1_Tagged` contains a `COSE_Sign1` structure. The following additional requirements apply to the construction of `COSE_Sign1_Tagged`:

*   The same `alg` header in the `Sig_structure` above shall be present in the `protected` header bucket.
    
*   The value for the `payload` field and whether the payload is present in the signature or detached will be specified by each use of digital signatures in this specification. When the `payload` is specified as detached, its value here shall be `nil`. Conversely, when the payload is present in the signature, the binary contents of the payload are stored in this field as a `bstr`.
    

> **NOTE:**
> COSE defines `nil` to be major type 7, value 22 in [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052), section 1.3, and uses this value exclusively for detached content. A byte array (major type 2) of length zero cannot be used to indicate detached content.

<a id="_adding_a_claimed_time_of_signing"></a>
