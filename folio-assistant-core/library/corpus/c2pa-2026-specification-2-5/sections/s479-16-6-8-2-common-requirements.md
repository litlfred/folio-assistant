---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s479-16-6-8-2-common-requirements
section_title: "16.6.8.2. Common Requirements"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9557-9566
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.8.2. Common Requirements

A metadata assertion shall have either a label which ends in the string `.metadata` or `.metadata.ingredient` and is preceded by either the standard `c2pa` identifier or any other provided that it conforms to the same syntax as [entity-specific namespaces](#_namespacing). For example, a `com.litware.metadata` assertion would be valid.

> **NOTE:**
> The `.metadata.ingredient` form supports [related assertions to ingredients](#ingredient_related_assertions).

Each metadata assertion shall contain a single JSON content type box containing the [JSON-LD](https://www.w3.org/TR/json-ld) serialization of one or more metadata values. The `@context` property within the JSON-LD object shall be included, and used to provide context / namespaces for the metadata standards being specified. The recommended procedure to create this JSON-LD object is to first create an [XMP Data Model](https://www.iso.org/standard/57421.html) representation of the metadata and then serialize that to JSON-LD according to [JSON-LD serialization of XMP](https://www.iso.org/standard/79384.html). The JSON-LD would then be stored as a JSON content type box.

<a id="_the_c2pa_metadata_assertion"></a>
