---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-048
section_title: "Page 48"
pages: 48-48
pdf_page: 48
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
encoding such subtypes and subrelations, alongside specialized structures. We opted for this
single approach to ensure simplicity and efficiency of parsers.
IC5:
The interoperability of the PROV-JSONLD serialization can be tested in different ways:
1. In a roundtrip testing, consisting of the serialization of an internal representation in some
programming language to PROV-JSONLD, followed by deserialization from PROV-
JSONLD back to the same programming language, the source and target representations are
expected to be equal.
2. Likewise, in a roundtrip testing, consisting of the serialization of an internal representation
in some programming language to PROV-JSONLD, followed by a conversion of PROV-
JSONLD to another RDF representation such as Turtle, followed by a reading of the Turtle
representation back to the same programming language, the source and target
representations are also expected to be equal.
3. Both interoperability tests have been implemented in the Java-based ProvToolbox, with:
{
  "@graph" : [
    {
      "@type" : "Agent",
      "@id" : "ex:derek",
      "type" : [ "prov:Person" ],
      "foaf:mbox" : [ {
          "@value" : "<mailto:derek@example.org>"
      } ],
      "foaf:givenName" : [ {
          "@value" : "Derek"
      } ]
    },  
    {
      "@type" : "Derivation",
      "generatedEntity" : "ex:dataSet2",
      "usedEntity" : "ex:dataSet1",
      "type" : [ "prov:Revision" ]
    }
  ]
}
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
48/71
