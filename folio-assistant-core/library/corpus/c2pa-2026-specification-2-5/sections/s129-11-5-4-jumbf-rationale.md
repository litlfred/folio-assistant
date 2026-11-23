---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s129-11-5-4-jumbf-rationale
section_title: "11.5.4. JUMBF Rationale"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1706-1730
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 11.5.4. JUMBF Rationale

In order to support many of the requirements of C2PA, C2PA Manifests needed to be stored (serialized) into a structured binary data store that enables some specific functionality including:

*   Ability to store multiple manifests (e.g., parents and ingredients) in a single container.
    
*   Ability to refer to individual elements (both within and across manifests) via URIs.
    
*   Ability to clearly identify the parts of an element to be hashed.
    
*   Ability to store pre-defined data types used by C2PA (e.g., JSON and CBOR).
    
*   Ability to store arbitrary data formats (e.g., XML, JPEG, etc.).
    

In addition to supporting all of the requirements above, our chosen container format - ISO 19566-5:2023 (JUMBF) - is also natively supported by the JPEG family of formats and is compatible with the box-based model (i.e., [ISO/IEC 14496-12, ISO BMFF](https://www.iso.org/standard/83102.html)) used by many common image and video file formats. Using JUMBF enables all the same benefits (and a few extras, such as [URI References](#_uri_references)) while being able to work with classic image formats, such as JPEG/JFIF and PNG as well as 3D and document (e.g., PDF) formats.

> **NOTE:**
> Since most of the standard assertions, as well the claim signature, are serialized as CBOR, using CBOR for the entire C2PA Manifest was considered but not chosen because CBOR is not a container format.
>
> For example, to store a "blob of JSON" inside of CBOR, and know that it is JSON (and not some other format) would necessitate designing a data structure for storing such things. Then the parent structure would need to be defined as to how to carry that structure. This same concept would also have to be done for each of the native features of JUMBF.
>
> While it would certainly be possible to re-implement all of the required functionality entirely in CBOR, it would be a lot of work and would not fully remove the need for a JUMBF/BMFF parser in all implementations.

<a id="_embedding"></a>
