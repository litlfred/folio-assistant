---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-042-265-duty-property-with-a-permission
section_title: "Duty property with a Permission"
section_number: 2.6.5
pages: 22-23
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
EXAMPLE 20
{
  "@context": "http://www.w3.org/ns/odrl.jsonld",
  "@type": "Agreement",
  "uid": "http://example.com/policy:42",
  "profile": "http://example.com/odrl:profile:09",
  "obligation": [{
      "assigner": "http://example.com/org:43",
      "assignee": "http://example.com/person:44",
      "action": [{
          "rdf:value": {
            "@id": "odrl:compensate"
          },
          "refinement": [
            {
              "leftOperand": "payAmount",
              "operator": "eq",
              "rightOperand": { "@value": "500.00", "@type": "xsd:decimal" },
              "unit": "http://dbpedia.org/resource/Euro"
            }]
        }]
    }]
}
EXAMPLE 21
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:42B",
    "profile": "http://example.com/odrl:profile:09",
    "assigner": "http://example.com/org:43",
    "assignee": "http://example.com/person:44",
    "obligation": [{
   "action": "delete",
   "target": "http://example.com/document:XZY",
   "consequence": [{
   
 "action": [{
   
     "rdf:value": { "@id": "odrl:compensate" },
   
     "refinement": [{
   
        "leftOperand": "payAmount",
   
        "operator": "eq",
   
        "rightOperand": { "@value": "10.00", "@type": "xsd:decimal" },
   
        "unit": "http://dbpedia.org/resource/Euro"
   
     }]
   
 }],
   
 "compensatedParty": "http://wwf.org"
         }]
    }]
}
A Duty MAY be specified as a pre-condition that requires fulfillment using the duty property relationship from the Permission to
the Duty.
If a Permission has several Duties then all of the Duties MUST be agreed to be fulfilled. If several Permissions refer to the same
Duty (via its uid property), then the Duty only has to be fulfilled once.
If there are no function sub-properties declared in the Duty, then these functional roles will be the same as those declared in the
referring Permission.
Example Use Case: The Party http://example.com/assigner:sony makes an Offer to play the target asset
http://example.com/music/1999.mp3. The permission includes a duty for the compensate action that has a
refinement of payAmount of $EU5.00. The duty also has a constraint of event is less than policyUsage, meaning the
duty rule must be exercised (ie the compensation) before the permission rule can be exercised.
