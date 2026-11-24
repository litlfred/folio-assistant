---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s411-16-4-2-1-description
section_title: "16.4.2.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 7511-7565
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.2.1. Description

There are use cases where storing the data for an assertion remotely, such as in the cloud, is better than embedded inside the asset, especially for those cases where that data may change over time. Additionally, it may be important to reference non-assertion-based data stored externally. To address those needs, a specific type of assertion serves as an external reference to the location of that information. An external reference assertion may use an `unhashed-ext-uri-map` for the `location` field, where the referenced data is advisory and may change over time, or a `hashed-ext-uri-map`, where the referenced data is cryptographically bound to the manifest at signing time.

> **NOTE:**
> Both a hashed and an unhashed external reference assertion can be used for either arbitrary data (in any format) or a complete assertion, packaged as JUMBF.

An external reference assertion shall have a label of `c2pa.external-reference`. An external reference assertion should appear in `gathered_assertions` (see [Section 10.3.2.1, “Adding Assertions and Redactions”](#_adding_assertions_and_redactions)).

> **NOTE:**
> By including an external reference assertion in `created_assertions` the signer is taking responsibility for the data that is referred to by the assertion.

When used to reference an assertion, the `label` field shall be present and shall indicate the label of the complete assertion (packaged as JUMBF). An external reference assertion shall not reference an assertion with any of the following labels:

*   `c2pa.actions` (deprecated)
    
*   `c2pa.actions.v2`
    
*   `c2pa.cloud-data`
    
*   `c2pa.external-reference`
    
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
    

If the `label` field is not present, the referenced data may be of any type.

The `location` field shall be present and its value shall be either a `hashed-ext-uri-map` or an `unhashed-ext-uri-map` containing a valid URI (`url`). Those maps may also contain one or more optional values, including a valid IANA media type (`dc:format`) and the size of the externally referenced data (`size`). The `size` field should not be included if the size of the externally referenced data is subject to change.

> **NOTE:**
> The `data_types` field of the `location` map can also be used to describe the kind of data referenced.

For privacy and reliability reasons, data referenced through an external reference assertion shall be considered optional: its contents should not be retrieved as part of manifest validation. A validator may retrieve the contents to serve an application-dependent need. For unhashed references, retrieved data shall be treated as advisory unless independently verified by other means. Validation of hashed references is described in [Section 14.10.4.2.2, “`c2pa.external-reference` validation”](#_c2pa_external_reference_validation).

Additional metadata about the referenced data may be described in the assertion’s optional `metadata` field. When present, the `description` field provides a human-readable summary of the referenced data.

<a id="_process_evidence"></a>
