---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s246-14-10-5-2-validation-of-external-references
section_title: "14.10.5.2. Validation of External References"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3411-3436
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.10.5.2. Validation of External References

The following procedure shall be used to validate the external data referenced in a cloud data or hashed external reference assertion. Network retrieval performed as part of this procedure may apply the countermeasures described in [Section 14.10.5.3, “Retrieval Security”](#_retrieval_security).

1.  Resolve the URI reference in the `url` field and retrieve its data. If the `url` field is not present, the validator aborts the attempt by applying a countermeasure described in [Section 14.10.5.3, “Retrieval Security”](#_retrieval_security), or the URI otherwise cannot be resolved and the data retrieved, the validator shall abort the attempt to retrieve the external data and shall not perform the remaining steps.
    
2.  Determine the retrieved representation of the response as described in [Section 14.10.5.3.5, “Retrieved representation”](#_retrieved_representation). If the length of the retrieved representation is not equal to the value of the `size` field, the validator shall return a failure code of `assertion.hashedURI.mismatch` to the application and not provide the retrieved data.
    
3.  Validate that the media type of the retrieved representation, as declared in the `Content-Type` header of the HTTP response, is equal to the declared content type. If they do not match, the validator shall return a failure code of `assertion.hashedURI.mismatch` to the application and not provide the retrieved data. The declared content type is determined by:
    
    1.  For external data, the content type is determined by the `dc:format` field of the `hashed_ext_uri` or `unhashed_ext_uri` structure. If the `dc:format` field is absent, content type validation is always successful.
        
    2.  For a cloud data assertion, if the `dc:format` field is not present in its `location` field, the media type shall default to `application/jumbf`. The `content_type` field in the cloud data assertion, if present, shall be ignored.
        
    
4.  For a `hashed_ext_uri`, determine the hash algorithm to be used as specified in [Section 14.4.3, “For Hashed Ext URIs”](#_for_hashed_ext_uris) or possible failure codes.
    
    1.  Compute the hash of the retrieved representation using the determined hash algorithm and the procedure described in [Section 9.4.2.3, “Hashing JUMBF Boxes”](#_hashing_jumbf_boxes).
        
    2.  Compare the computed hash value with the value in the `hash` field. If the `hash` field is not present or they do not match, the validator shall return a failure code of `assertion.hashedURI.mismatch` to the application and not provide the retrieved data.
        
    3.  Otherwise, the validator shall record a success code of `assertion.hashedURI.match` and provide the retrieved data to the application.
        
    

<a id="_retrieval_security"></a>
