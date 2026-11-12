---
doc_id: w3c-2013-prov-o
doc_title: "PROV-O: The PROV Ontology W3C Recommendation 30 April 2013 This version: Latest published version: Implementation report: Previous version: Editors:"
section_id: sec-012-2-prov-o-at-a-glance
section_title: "PROV-O at a glance"
section_number: 2
pages: 2-3
source_pdf: w3c-2013-prov-o.pdf
source_sha256: 9238233b5b20d980
toc_source: outline
---
3. The PROV-O Ontology Description
3.1 Starting Point Terms
3.2 Expanded Terms
3.3 Qualified Terms
4. Cross reference for PROV-O classes and properties
4.1 Starting Point Terms
4.2 Expanded Terms
4.3 Qualified Terms
4.4 Term Index
A. PROV-O OWL Profile
B. Names of inverse properties
C. Changes since WD-prov-o-20120724
D. Changes since CR-prov-o-20121211
E. Changes since PR-prov-o-20130312
F. Acknowledgements
G. References
G.1 Normative references
G.2 Informative references
1. Introduction
The PROV Ontology (PROV-O) defines the OWL2 Web Ontology Language encoding of the PROV Data Model [PROV-DM]. This document
describes the set of classes, properties, and restrictions that constitute the PROV Ontology. This ontology specification provides the foundation
to implement provenance applications in different domains that can represent, exchange, and integrate provenance information generated in
different systems and under different contexts. Together with the PROV Access and Query [PROV-AQ] and PROV Data Model [PROV-DM], this
document forms a framework for provenance information interchange in domain-specific Web-based applications.
PROV-O is a lightweight ontology that can be adopted in a wide range of applications. With the exception of five axioms, PROV-O conforms to
the OWL-RL profile [OWL2-PRIMER]. The PROV Ontology classes and properties are defined such that they can not only be used directly to
represent provenance information, but also can be specialized for modeling application-specific provenance details in a variety of domains. Thus,
the PROV Ontology is expected to be both directly usable in applications as well as serve as a reference model for creating domain-specific
provenance ontologies and thereby facilitates interoperable provenance modeling. To demonstrate the use of PROV-O classes and properties,
this document uses an example provenance scenario similar to the one introduced in the PROV-Primer [PROV-PRIMER].
The PROV Data Model [PROV-DM] introduces a set of concepts to represent provenance information in a variety of application domains. This
document maps the PROV Data Model to PROV Ontology using the OWL2 ontology language [OWL2-OVERVIEW].
We briefly introduce some of the OWL2 modeling terms that will be used to describe the PROV Ontology. An OWL2 instance is an individual
object in a domain of discourse, for example a person named Alice or a car named KITT. A set of individuals sharing common characteristics
constitutes a class. Person and Car are examples of classes representing the set of individual persons and cars respectively. The OWL2 object
properties are used to link individuals, classes, or create a property hierarchy. For example, the object property "hasOwner" can be used to link
car with person. The OWL2 datatype properties are used to link individuals or classes to data values, including XML Schema datatypes
[XMLSCHEMA11-2].
1.1 Compliance with this Document
For the purpose of compliance, the normative sections of this document are Section 1.1, Section 1.2, Section 3, Section 4, and Appendix B
Information in tables is normative if it appears in a normative section.
All figures and diagrams are informative.
All examples are informative.
1.2 Notational Conventions
The key words "must", "must not", "required", "shall", "shall not", "should", "should not", "recommended", "may", and "optional" in this document are
to be interpreted as described in [RFC2119].
1.3 Namespaces
This section is non-normative.
The following namespace prefixes are used throughout this document.
Table 1: Prefix and Namespaces used in this specification
prefix
namespace IRI
definition
rdf
http://www.w3.org/1999/02/22-rdf-syntax-ns# The RDF namespace [RDF-CONCEPTS]
xsd
http://www.w3.org/2000/10/XMLSchema#
XML Schema Namespace [XMLSCHEMA11-2]
owl
http://www.w3.org/2002/07/owl#
The OWL namespace [OWL2-OVERVIEW]
prov
http://www.w3.org/ns/prov#
The PROV namespace [PROV-DM]
(others) (various)
All other namespace prefixes are used in examples only.
In particular, IRIs starting with "http://example.com" represent
some application-dependent IRI [IRI]
2. PROV-O at a glance
This section is non-normative.
PROV-O users may only need to use parts of the entire ontology, depending on their needs and according to how much detail they want to
include in their provenance information. For this, the PROV-O terms (classes and properties) are grouped into three categories to provide an
