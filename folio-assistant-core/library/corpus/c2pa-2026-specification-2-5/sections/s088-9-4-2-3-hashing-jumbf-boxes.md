---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s088-9-4-2-3-hashing-jumbf-boxes
section_title: "9.4.2.3. Hashing JUMBF Boxes"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1150-1170
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 9.4.2.3. Hashing JUMBF Boxes

When creating a URI reference to any JUMBF box (e.g., [assertions](#_assertions) and [data boxes](#_data_boxes)), the hash shall be performed over the contents of the structure’s JUMBF superbox, which includes both the JUMBF Description Box and all content boxes therein (but does not include the structure’s JUMBF superbox header).

> **NOTE:**
> More details on hashing can be found at [Section 12.1, “Hashing”](#_hashing).

As described in the latest version of JUMBF (ISO 19566-5:2023), and shown in [Figure 5, “Example `c2pa.actions` assertion”](#example-actions-assertion), a new `Private` field can be present as part of any JUMBF Description box. This C2PA specification defines the C2PA salt as a `Private` field whose value is a standard box consisting of:

*   a box length (LBox, as a 4-byte big-endian unsigned integer);
    
*   a box type (TBox, 4-byte big-endian unsigned integer, with a value of `c2sh` (for C2PA salt hash));
    
*   and payload data (consisting of randomly-generated binary data of either 16 or 32 bytes in length).
    

![Example assertion structure](_images/assertion_JUMBF.drawio.svg)

Figure 5. Example `c2pa.actions` assertion

<a id="_claims"></a>
