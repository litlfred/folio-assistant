---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-043-266-consequence-property-with-a-permissionobliga
section_title: "Consequence property with a Permission/Obligation Duty"
section_number: 2.6.6
pages: 23-24
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A duty of a Permission, and obligation of a Policy, MAY include a consequence Duty of not fulfilling that duty or obligation. In
this case, all consequence Duties MUST also be fulfilled to set the final state of the Permission/Obligation Duty to fulfilled.
The consequence property is a sub-property of the failure property. See the Duty Class section for more about the consequence
property.
Example Use Case: The below Agreement between assigner http://example.com/org:99 and assignee
http://example.com/person:88 allows the assignee to distribute the Asset http://example.com/data:77 under
the pre-condition they attribute the asset to Party http://australia.gov.au/. If the assignee does not fulfil the
duty, or distributes the asset without fulfilling the duty, then the consequence will be that they will also be tracked by
http://example.com/dept:100.
EXAMPLE 22
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Offer",
    "uid": "http://example.com/policy:88",
    "profile": "http://example.com/odrl:profile:09",
    "permission": [{
        "assigner": "http://example.com/assigner:sony",
        "target": "http://example.com/music/1999.mp3",
        "action": "play",
        "duty": [{
           "action": [{
              "rdf:value": { "@id": "odrl:compensate" },
              "refinement": [{
                 "leftOperand": "payAmount",
                 "operator": "eq",
                 "rightOperand": { "@value": "5.00", "@type": "xsd:decimal" },
                 "unit": "http://dbpedia.org/resource/Euro"
              }]
            }],
            "constraint": [{
                "leftOperand": "event",
                "operator": "lt",
                "rightOperand": { "@id": "odrl:policyUsage" }
            }]
        }]
    }]
}  
EXAMPLE 23
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:66",
    "profile": "http://example.com/odrl:profile:09",
