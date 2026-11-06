---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s612-a-6-3-placement-of-the-manifest-store
section_title: "A.6.3. Placement of the Manifest Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 11879-11888
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.6.3. Placement of the Manifest Store

The C2PA Manifest Store shall be stored in the `META-INF` directory of the ZIP archive with a filename of `content_credential.c2pa` and a media type as recommended for [external manifests](#_external_manifests). The file shall be stored (compression method 0) and not encrypted.

When the ZIP-based format is an Open Packaging Conventions (OPC) package, such as Office Open XML or OpenXPS, OPC requires every part of the package to have a content type declared in the package’s `[Content_Types].xml` part. A claim generator embedding a C2PA Manifest Store in such a package shall ensure that `[Content_Types].xml` declares the media type `application/c2pa` for the C2PA Manifest Store, either with a `Default` element for the `c2pa` extension or with an `Override` element for the part name `/META-INF/content_credential.c2pa`. Because `[Content_Types].xml` is an entry covered by the collection data hash, the claim generator shall make this change before computing the collection data hash.

> **NOTE:**
> OPC consumers can treat a package containing a part with no declared content type as damaged. For example, an application can offer to repair such a package and, in doing so, remove the C2PA Manifest Store.

<a id="_digitally_signing_zip_based_formats"></a>
