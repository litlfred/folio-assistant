---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
EXAMPLE 1
{
  "@context" : [ {
    "xsd" : "http://www.w3.org/2001/XMLSchema#",
    "dcterms" : "http://purl.org/dc/terms/",
    "ex" : "http://example/",
    "prov" : "http://www.w3.org/ns/prov#",
    "foaf" : "http://xmlns.com/foaf/0.1/"
  }, "https://openprovenance.org/prov-jsonld/context.jsonld" ],
  "@graph" : [ {
    "@type" : "Entity",
    "@id" : "ex:dataSet1"
  }, {
    "@type" : "Entity",
    "@id" : "ex:article1",
    "dcterms:title" : [ {
"@value" : "Crime rises in cities",
"@language" : "EN"
    } ]
  }, {
    "@type" : "Derivation",
    "generatedEntity" : "ex:article1",
    "usedEntity" : "ex:dataSet1"
  }, {
    "@type" : "Agent",
    "@id" : "ex:derek",
    "type" : [ "prov:Person" ],
    "foaf:givenName" : [ {
      "@value" : "Derek"
    } ],
    "foaf:mbox" : [ {
      "@value" : "<mailto:derek@example.org>"
    } ]
  }, {
    "@type" : "Association",
    "activity" : "ex:compose",
    "agent" : "ex:derek"
  }, {
    "@type" : "Activity",
    "@id" : "ex:compose"
  }, {
    "@type" : "Usage",
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
9/71
