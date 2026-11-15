---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-031
section_title: "Page 31"
pages: 31-31
pdf_page: 31
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"oneOf": [
{
"type": "string",
"format": "uri"
},
{
"type": "object",
"title": "The Items Schema"
"additionalProperties": { "
                                        }
                                ]
                }
}
}
In this section, we provide a description of the JSON-LD context to map the PROV-JSON structures
to linked data. Full details of the context can be found in Appendix B.
The Ontology PROV-O [PROV-O] defines the Qualification Pattern, which restates a binary property
between two resources (referred to as an unqualified influence relation) by using an intermediate class
that represents the influence between two resources. This new instance, in turn, can be annotated with
additional descriptions of the influence that one resource had upon another. The following figure,
borrowed from [PROV-O], summarises the PROV relations, and how they are encoded in RDF using
the Qualification Pattern. Note that the figure does not include the Qualification Pattern for Influence;
in addition, PROV-O does not define the Qualification Pattern for specialization, alternate and
membership.
§ 5. JSON-LD Context
§ 5.1 Introduction: Qualification Pattern
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
31/71
