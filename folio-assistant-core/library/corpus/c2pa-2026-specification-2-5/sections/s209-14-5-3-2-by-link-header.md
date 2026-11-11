---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s209-14-5-3-2-by-link-header
section_title: "14.5.3.2. By `Link` header"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2747-2756
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 14.5.3.2. By `Link` header

If the asset was retrieved via an HTTP connection, the validator should look in the header of the HTTP response for a `Link` header, as defined in [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288), containing a parameter of `rel=c2pa-manifest`. If present, a C2PA Manifest Store can be retrieved from that URI reference. The URI will be a standard `http` or `https` URI, such as https://c2pa.org/image.c2pa.

It is also possible to use the link relation to refer to the C2PA Manifest Store that is embedded inside an asset through the use of a [JUMBF URI](#_uri_references) fragment. The URI would include a [JUMBF URI](#_uri_references) fragment, to the C2PA Manifest Store superbox https://c2pa.org/image.jpg#jumbf=c2pa. References to specific C2PA Manifests within the C2PA Manifest Store are not permitted and the validator shall ignore any `childlabel` portion of the [JUMBF URI](#_uri_references) fragment.

> **NOTE:**
> HTTP refers to the _Hypertext Transfer Protocol_ defined in [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), not the specific URL scheme `http://`.

<a id="_decompression"></a>
