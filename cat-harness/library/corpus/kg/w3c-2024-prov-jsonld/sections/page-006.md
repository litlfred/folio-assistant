---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
1.1 [JSON-LD11] and is a key enabler of this specification, allowing for the same natural PROV
property names to be used in different contexts while still maintaining their correct mappings to the
appropriate RDF properties.
Thus, this specification proposes PROV-JSONLD, a PROV serialization compatible with [PROV-DM]
that addresses all of our 4 key requirements. It is, first and foremost, a JSON structure supporting
lightweight Web applications. It is structured so that each PROV expression is encoded as a self-
contained JSON object and, therefore, is natural to JavaScript programmers. Exploiting JSON-LD 1.1,
we defined contextual semantic mappings, allowing PROV-JSONLD to be seen as linked data. And
finally, PROV-JSONLD allows for efficient processing since each JSON object can be readily mapped
to a data structure without requiring unbounded lookaheads or search within the data structure.
In the rest of this document, we illustrate PROV-JSONLD, we characterize its structure using a JSON
Schema [JSON-SCHEMA], we define its semantic mappings using JSON-LD 1.1, and we outline the
interoperability testing we put in place to check its compatibility with the PROV data model.
The following namespaces prefixes are used throughout this document.
Table 1: Prefix and Namespaces used in this specification
prefix
namespace IRI
definition
prov
http://www.w3.org/ns/prov#
The PROV namespace [PROV-DM]
provext https://openprovenance.org/ns/provext#
Extension namespace for PROV used in this
specification
xsd
http://www.w3.org/2000/10/XMLSchema# XML Schema Namespace [XMLSCHEMA11-
2]]
rdf
http://www.w3.org/1999/02/22-rdf-syntax-
ns#
The RDF namespace [RDF-CONCEPTS]
(others) (various)
All other namespace prefixes are used in
examples only.
In particular, IRIs starting with
"http://example.com" represent some
application-dependent IRI [RFC3987]
§ 2.1 Namespace
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
6/71
