---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s463-16-6-3-3-details-on-selection-of-a-value-for-typ
section_title: "16.6.3.3. Details on selection of a value for `type`"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9064-9097
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.3.3. Details on selection of a value for `type`

If an asset’s exact type is specified in the [IANA registry application type](https://www.iana.org/assignments/media-types/media-types.xhtml#application) or [IANA registry text type](https://www.iana.org/assignments/media-types/media-types.xhtml#text), including JSON, CSV, and XML types, this information should be included in the asset type assertion `dc:format` field.

For example, if the asset is a CSV formatted text file, the `dc:format` field would be `text/csv`.

An asset type assertion may contain both a Dublin Core format and a C2PA standard or custom asset type to provide additional information about the asset’s type. Some existing Dublin Core types that are commonly used in an asset type assertion in combination with other asset types are specified in [Table 9, “Common DC formats”](#common-dc-formats).

**Table 9. Common DC formats**

| dc:format Value | Description of Dublin Core Type of the Asset |
| --- | --- |
| application/json | Stored using the JSON format |
| application/gzip | Stored using the GZIP format |
| application/vnd.rar | Stored using the RAR format |
| application/zip | Stored using the ZIP format |
| application/octet-stream | Stored using an arbitrary binary format |
| text/csv | Stored using the CSV format |
| text/plain | Stored using the plain text format |
| text/tab-separated-values | Stored using the tab-separated-values (TSV) text format |
| text/xml | Stored using the XML format |

[IANA structured suffixes](https://www.iana.org/assignments/media-type-structured-suffix/media-type-structured-suffix.xhtml), such as `+json` and `+zip`, are also supported in the C2PA Claim’s `dc:format` field to specify additional types.

Some dc:format types are commonly used but are not specified in the [IANA registry](https://www.iana.org/assignments/media-types/media-types.xhtml). The following `dc:format` values are valid for C2PA assets, as shown in [Table 10, “Additional formats”](#extra-dc-formats).

**Table 10. Additional formats**

| dc:format Value | Description of Dublin Core Type of the Asset |
| --- | --- |
| application/x-hdf5 | Stored using the HDF5 format |
| application/x-7z-compressed | Stored using the 7Z format |

<a id="_font_information"></a>
