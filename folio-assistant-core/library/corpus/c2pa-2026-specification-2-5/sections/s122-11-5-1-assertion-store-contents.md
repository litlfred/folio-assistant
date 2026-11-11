---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s122-11-5-1-assertion-store-contents
section_title: "11.5.1. Assertion Store Contents"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1639-1648
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 11.5.1. Assertion Store Contents

The [C2PA Assertion Store](#assertion-store-arch) is a JUMBF superbox that shall have the label and type given in [Table 2, “C2PA JUMBF boxes”](#table_c2pa_jumbf_boxes). It shall contain one or more JUMBF superboxes (called C2PA Assertion boxes) whose JUMBF type defines the type of the sub-boxes that contain the assertion data (ISO 19566-5:2023, Annex B). These superboxes shall each have a label as defined in [Standard Assertions](#_c2pa_standard_assertions) and shall contain a JUMBF Description Box, one or more JUMBF Content Boxes and possibly a Padding Box (ISO 19566-5:2023, A.4).

The JUMBF Content Type (ISO 19566-5:2023, Annex B) box(es) contained in each assertion superbox should be CBOR Content Type (`cbor`), JSON Content Type (`json`), Embedded File Content Type (`bfdb` & `bidb`) or UUID Content Type (`uuid`) though any Content Type defined in JUMBF (ISO 19566-5:2023) and its amendments is permitted. In addition, a JUMBF Protection Box as described in ISO 19566-4:2020 may also be used.

> **NOTE:**
> Custom assertions containing other formats/serializations of data, such as encrypted data, are supported through the use of a UUID Content Box containing the custom UUID followed by the data (ISO 19566-5:2023, B.5).

<a id="_compressed_manifests"></a>
