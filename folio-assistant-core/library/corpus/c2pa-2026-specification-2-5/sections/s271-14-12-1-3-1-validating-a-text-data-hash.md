---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s271-14-12-1-3-1-validating-a-text-data-hash
section_title: "14.12.1.3.1. Validating a text data hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3786-3815
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.12.1.3.1. Validating a text data hash

For assets consisting of unstructured text with an embedded `C2PATextManifestWrapper`, validators shall perform the following when validating a `c2pa.hash.data` hard binding:

1.  Locate all valid `C2PATextManifestWrapper` instances as described in [Locating the manifest in unstructured text](#text_manifest_detection_algorithm).
    
    1.  When decoding a wrapper, a validator shall accept a decoded byte stream whose length is greater than or equal to `manifestLength + 13` (the header size). The manifest bytes are extracted using `manifestLength`; trailing bytes are padding and shall be ignored.
        
    
2.  Identify the wrapper(s) whose byte range matches the exclusion range(s) specified in the `exclusions` field of the `c2pa.hash.data` assertion. The byte range of a wrapper includes any trailing padding bytes.
    
3.  If no wrapper matches the `exclusions`, reject with `assertion.dataHash.malformed`.
    
4.  Remove the wrapper bytes from the text according to the exclusion range(s), including any padding.
    
5.  Normalize the remaining text to NFC (Normalization Form Canonical Composition).
    
6.  Encode the normalized text as UTF-8 bytes.
    
7.  Compute the hash over these bytes using the algorithm specified by the `alg` field of the `c2pa.hash.data` assertion (see [Determining the hashing algorithm](#_determining_the_hashing_algorithm) and [Algorithm validation](#_algorithm_validation)).
    
8.  Compare the computed hash with the `hash` value stored in the `c2pa.hash.data` assertion.
    
    1.  If the hashes match, record the success code `assertion.dataHash.match`.
        
    2.  If the hashes do not match, reject with the failure code `assertion.dataHash.mismatch`.
        
    

<a id="_validation_result_codes"></a>
