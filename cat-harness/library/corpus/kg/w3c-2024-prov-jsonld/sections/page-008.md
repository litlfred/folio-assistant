---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-008
section_title: "Page 8"
pages: 8-8
pdf_page: 8
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
PROV expressions can be enriched with various properties. Some properties are predefined by PROV-
JSONLD such as activity and agent in a Association. Further PROV attributes are allowed, for
instance type with an array of further types, to better describe the resource. Others may be defined in a
different namespace such as foaf:givenName, for which we expect the prefix foaf to be declared in the
@context property.
The property @type is mandatory and is associated with a single value, expected to be one of the
predefined PROV expressions. From an efficiency viewpoint, this property is critical in determining
which internal data structure a PROV expression should map to, and therefore, facilitates efficient
processing. On the contrary, type is optional and can contain as many types as required; their order is
not significant.
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
8/71
