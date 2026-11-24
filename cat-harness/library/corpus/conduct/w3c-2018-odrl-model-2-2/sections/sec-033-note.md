---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-033-note
section_title: "NOTE"
section_number: null
pages: 16-17
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
Example Use Case: In the Policy Offer example below, the permission allows the target asset to be printed, and also
include a refinement Constraint of less than or equal to 1200 dpi resolution. The refinement is a more narrower
semantic of printing, in this case, printing at a specific maximum resolution level.
Example Use Case:The Policy below shows a permission to reproduce the target asset either via online media or
print media but not both. This is expressed as a Logical Constraint (with the xone operand) referring to two existing
Constraints declared elsewhere.
EXAMPLE 13
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Offer",
    "uid": "http://example.com/policy:6163",
    "profile": "http://example.com/odrl:profile:10",
    "permission": [{
       "target": "http://example.com/document:1234",
       "assigner": "http://example.com/org:616",
       "action": "distribute",
       "constraint": [{
           "leftOperand": "dateTime",
           "operator": "lt",
           "rightOperand":  { "@value": "2018-01-01", "@type": "xsd:date" }
       }]
   }]
}
EXAMPLE 14
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Offer",
    "uid": "http://example.com/policy:6161",
    "profile": "http://example.com/odrl:profile:10",
    "permission": [{
       "target": "http://example.com/document:1234",
       "assigner": "http://example.com/org:616",
       "action": [{
          "rdf:value": { "@id": "odrl:print" },
          "refinement": [{
             "leftOperand": "resolution",
             "operator": "lteq",
             "rightOperand": { "@value": "1200", "@type": "xsd:integer" },
             "unit": "http://dbpedia.org/resource/Dots_per_inch"
          }]
      }]
   }]
}
EXAMPLE 15
