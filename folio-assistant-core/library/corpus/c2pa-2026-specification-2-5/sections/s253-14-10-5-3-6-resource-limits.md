---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s253-14-10-5-3-6-resource-limits
section_title: "14.10.5.3.6. Resource limits"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3492-3516
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.5.3.6. Resource limits

For the purposes of this section, a _retrieval attempt_ is a single request-response exchange, including a request made to a redirect target, and a _validation operation_ is the complete process of resolving, retrieving, decoding, and validating the data referenced by one `hashed_ext_uri`, `unhashed_ext_uri`, or cloud data `location`, including all redirects followed for that reference.

A validator may enforce, for each validation operation:

*   a maximum number of redirects, as described in [Section 14.10.5.3.4, “Redirect handling”](#_redirect_handling);
    
*   a maximum number of encoded bytes read from the network before decoding;
    
*   a maximum number of decoded representation bytes, as described in [Section 14.10.5.3.5, “Retrieved representation”](#_retrieved_representation), enforced separately from the encoded-byte limit;
    
*   a maximum decompression nesting depth, when the response declares more than one chained `Content-Encoding`; and
    
*   a single deadline for the operation, covering DNS resolution, redirect handling, connection establishment, data transfer, content decoding, and validation of the retrieved data.
    

Across all validation operations performed while validating a single claim, a validator may also enforce a maximum total number of retrieval attempts and a maximum number of validation operations performed concurrently.

If a limit that the validator enforces is exceeded, the validator may abort the retrieval and discard any partial data.

> **NOTE:**
> The `size` field in `c2pa.cloud-data` and `hashed_ext_uri` structures provides an a priori bound on decoded representation bytes that a validator can apply as a read limit before or during retrieval, avoiding the need to buffer the entire response before checking its length.

<a id="_validate_the_ingredients"></a>
