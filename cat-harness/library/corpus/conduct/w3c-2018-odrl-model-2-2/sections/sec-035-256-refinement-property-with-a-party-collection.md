---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-035-256-refinement-property-with-a-party-collection
section_title: "Refinement property with a Party Collection"
section_number: 2.5.6
pages: 18-19
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A PartyCollection MAY include a refinement property to indicate the refinement context under which to identify individual
Party(ies) of the complete collection. The refinement property applies to the characteristics of each member of the collection
(and not the resource as a whole). To meet this condition of identifying individual Party(ies) of the complete PartyCollection,
all of the Constraints/Logical Constraints referenced by the refinement property MUST be satisfied.
Note: The outcome of applying refinements to a PartyCollection SHOULD NOT result in a null set.
Note that when using the refinement property, the uid property MUST NOT be used to identify the PartyCollection. Instead,
the source property MUST be used to reference the PartyCollection.
Example Use Case: The target Asset http://example.com/myPhotos:BdayParty is a set of photos posted to a
social network site by the assigner of the photos http://example.com/user44. The assignee source is a
PartyCollection http://example.com/user44/friends and represents all the friends of the assigner. The assignee
also has a refinement that indicates only members of the collection over the foaf:age of 18 will be assigned the
ex:view permission (defined by the Profile).
EXAMPLE 16
{
  "@context": "http://www.w3.org/ns/odrl.jsonld",
  "@type": "Offer",
  "uid": "http://example.com/policy:4444",
  "profile": "http://example.com/odrl:profile:11",
  "permission": [{
    "assigner": "http://example.com/org88",
    "target": {
      "@type": "AssetCollection",
      "source":  "http://example.com/media-catalogue",
      "refinement": [{
        "leftOperand": "runningTime",
        "operator": "lt",
        "rightOperand": { "@value": "60", "@type": "xsd:integer" },
        "unit": "http://qudt.org/vocab/unit/MinuteTime"
      }]
    },
    "action": "play"
  }]
}
EXAMPLE 17
{
  "@context": "http://www.w3.org/ns/odrl.jsonld",
  "@type": "Agreement",
  "uid": "http://example.com/policy:4444",
  "profile": "http://example.com/odrl:profile:12",
  "permission": [{
    "target": "http://example.com/myPhotos:BdayParty",
    "assigner": "http://example.com/user44",
    "assignee": {
      "@type": "PartyCollection",
      "source":  "http://example.com/user44/friends",
      "refinement": [{
        "leftOperand": "foaf:age",
        "operator": "gt",
        "rightOperand": { "@value": "17", "@type": "xsd:integer" }
      }]
    },
    "action": { "@id": "ex:view" }
  }]
}
