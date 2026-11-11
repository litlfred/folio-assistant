---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s144-12-2-2-2-hashing-using-a-general-box-hash
section_title: "12.2.2.2. Hashing using a general box hash"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 1893-1897
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 12.2.2.2. Hashing using a general box hash

When an asset’s format is a non-BMFF-based box format, such as JPEG 1, PNG, GIF or others listed [here](#_handling_for_specific_formats), then a [general box hash](#_general_box_hash) assertion should be used. This assertion consists of an array of structures, each one listing one or more boxes (by their name/identifier) and a hash that covers that data of those boxes (and any possible data that may be present in the file between them), along with the algorithm used for [hashing](#_hashing).

<a id="_hashing_a_bmff_formatted_asset"></a>
