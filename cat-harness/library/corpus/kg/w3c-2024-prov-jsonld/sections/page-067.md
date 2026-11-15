---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-067
section_title: "Page 67"
pages: 67-67
pdf_page: 67
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"Alternate": {
    "@id": "provext:Alternate",
    "@context": {
"alternate1": {
    "@reverse" : "provext:qualifiedAlternate",
    "@type" : "@id"
},
"alternate2": {
    "@id": "provext:alternate",
    "@type": "@id"
}
    }
}
    }
}
We provide here a minimal definition of the classes and properties introduced in provext in the context
of PROV-JSONLD. They allow the qualification pattern to be applied to Membership, Specialization
and Alternate. For each, we define one class and two object properties.
@prefix : <https://openprovenance.org/ns/provext#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix xml: <http://www.w3.org/XML/1998/namespace> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@base <https://openprovenance.org/ns/provext#> .
<https://openprovenance.org/ns/provext#> rdf:type owl:Ontology .
#################################################################
#    Object Properties
#################################################################
###  http://www.w3.org/2002/07/owl#topObjectProperty
owl:topObjectProperty rdf:type owl:ObjectProperty ,
§ C. PROVEXT: PROV Ontology Extension for PROV-JSONLD
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
67/71
