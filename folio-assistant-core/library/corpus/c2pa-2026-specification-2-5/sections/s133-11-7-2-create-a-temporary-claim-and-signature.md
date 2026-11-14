---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s133-11-7-2-create-a-temporary-claim-and-signature
section_title: "11.7.2. Create a temporary Claim and Signature"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1766-1783
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 11.7.2. Create a temporary Claim and Signature

Add the newly created data hash assertion reference to the claim’s assertion list providing a temporary hash value, such as empty spaces.

At this point, the temporary claim is complete and can be added to the C2PA Manifest being created.

Since the claim is only temporary at this time, it is not possible to sign it. To ensure the claim signature box contains a valid CBOR structure, create a temporary `COSE_Sign1_Tagged` structure as described in {8152}, section 4.2. The `COSE_Sign1_Tagged` is a tag byte followed by a `COSE_Sign1` structure, which is a four-element CBOR array. Construct the array as follows:

*   The first element is the `protected` header bucket ({8152}, section 3). Create an empty bucket by placing a `bstr` of size 0 in this position.
    
*   The second element is the `unprotected` header bucket, which is a CBOR map. Create a map of 1 pair. Use the string `pad` as the label, and place a `bstr` of the desired padding size filled with zero bytes (0x00) as the value. A 25 kilobyte size is recommended for the initial size of this padding.
    
*   The third element is the `payload`. Place the value `nil` (CBOR major type 7, value 22) here.
    
*   The fourth element is `signature`. Place a `bstr` of size 0 here.
    

<a id="_complete_the_c2pa_manifest"></a>
