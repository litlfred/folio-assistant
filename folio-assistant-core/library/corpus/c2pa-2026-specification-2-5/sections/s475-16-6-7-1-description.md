---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s475-16-6-7-1-description
section_title: "16.6.7.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9457-9506
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.7.1. Description

A cloud data assertion references a remotely-stored C2PA assertion packaged as JUMBF.

> **NOTE:**
> For other externally stored data, whether assertion or non-assertion, see the [external reference](#external_reference_assertion) assertion.

For privacy and reliability reasons, data referenced through a cloud data assertion shall be considered optional: their contents should not be retrieved as part of manifest validation. A validator may retrieve the contents later to serve an application-dependent need, such as further exploration of the provenance history. The remote data described by a Cloud Data assertion must be static, as its location is specified via a hashed URI. To reference unhashed data that may change over time, an [external reference](#external_reference_assertion) assertion may be used.

The original cloud data assertion allowed for pointing to arbitrary data in the cloud, in a variety of formats. However, this doesn’t align with that actual data model used in C2PA, where assertions have a defined structure as a JUMBF box. Therefore, the cloud data assertion has been updated to clarify that it specifically points to an actual JUMBF box that is stored remotely. As such, the IANA media type for the data referenced by a cloud data assertion is always `application/jumbf`.

> **NOTE:**
> The `content_type` field was previously used to record this media type.

If [assertion metadata](#_metadata_about_assertions) is included as part of another assertion, then it too would be part of the information referenced from a cloud data assertion. It is also possible to store individual assertion metadata assertions remotely, just as with other assertion types.

A cloud data assertion shall have a label of `c2pa.cloud-data`.

A cloud data assertion shall not refer to an assertion with any of the following labels:

*   `c2pa.action` (deprecated)
    
*   `c2pa.actions.v2`
    
*   `c2pa.cloud-data`
    
*   `c2pa.hash.bmff.v2` (deprecated)
    
*   `c2pa.hash.bmff.v3`
    
*   `c2pa.hash.boxes`
    
*   `c2pa.hash.collection.data`
    
*   `c2pa.hash.data`
    
*   `c2pa.hash.multi-asset`
    
*   `c2pa.hash.segment`
    
*   `c2pa.ingredient` (deprecated)
    
*   `c2pa.ingredient.v2` (deprecated)
    
*   `c2pa.ingredient.v3`
    

Since the cloud data assertion only contains a reference to externally hosted data, the `size` field shall contain the size of the data being referenced. Because that is required to be present, the optional `size` field in the hashed external URI map shall not be present. Similarly, the optional `dc:format` field in the hashed external URI map shall not be present.

<a id="_schema_and_example_17"></a>
