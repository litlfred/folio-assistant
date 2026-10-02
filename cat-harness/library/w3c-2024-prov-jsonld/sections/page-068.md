---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-068
section_title: "Page 68"
pages: 68-68
pdf_page: 68
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
owl:TransitiveProperty .
:qualifiedMembership rdf:type owl:ObjectProperty ;
                    rdfs:domain prov:Entity ;
                    rdfs:range :Membership .
:qualifiedSpecialization rdf:type owl:ObjectProperty ;
                    rdfs:domain prov:Entity ;
                    rdfs:range :Specialization .
:qualifiedAlternate rdf:type owl:ObjectProperty ;
                    rdfs:domain prov:Entity ;
                    rdfs:range :Alternate .
:member rdf:type owl:ObjectProperty ;
                    rdfs:domain :Membership ;
                    rdfs:range :Entity .
:generalEntity rdf:type owl:ObjectProperty ;
                    rdfs:domain :Specialization ;
                    rdfs:range :Entity .
:alternate rdf:type owl:ObjectProperty ;
                    rdfs:domain :Alternate ;
                    rdfs:range :Entity .
#################################################################
#    Classes
#################################################################
:Membership rdf:type owl:Class .
:Alternate rdf:type owl:Class .
:Specialization rdf:type owl:Class .
#################################################################
#    Property chains
#################################################################
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
68/71
