---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s473-16-6-6-2-technical-details
section_title: "16.6.6.2. Technical Details"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9444-9453
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.6.2. Technical Details

Since the embedded data assertion is based on a JUMBF Embedded File content type box, it’s Embedded File Description box shall contain an IANA media type (e.g., `image/png`) as the value of the _MEDIA TYPE_ field, and may contain a file name as the value of the _FILE NAME_ field. It shall not have the `External` toggle bit set.

> **NOTE:**
> IANA structured suffixes ([https://www.iana.org/assignments/media-type-structured-suffix/media-type-structured-suffix.xhtml](https://www.iana.org/assignments/media-type-structured-suffix/media-type-structured-suffix.xhtml)), such as `+json` and `+zip`, are also supported as values of the _MEDIA TYPE_ field.

The Binary Data box of the embedded data assertion shall be the bits of a file (such as a raster image or text prompt) in whatever format is desired by the claim generator, but matches the media type specified in the Embedded File Description box.

<a id="_cloud_data"></a>
