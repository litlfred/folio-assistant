---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-034-255-refinement-property-with-an-asset-collection
section_title: "Refinement property with an Asset Collection"
section_number: 2.5.5
pages: 17-18
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An AssetCollection MAY include a refinement property to indicate the refinement context under which to identify individual
Asset(s) of the complete collection. The refinement property applies to the characteristics of each member of the collection (and
not the resource as a whole). To meet this condition of identifying individual Asset(s) of the complete AssetCollection, all of
the Constraints/Logical Constraints referenced by the refinement property MUST be satisfied.
Note: The outcome of applying refinements to an AssetCollection SHOULD NOT result in a null set.
Note that when using the refinement property, the uid property MUST NOT be used to identify the AssetCollection. Instead,
the source property MUST be used to reference the AssetCollection.
Example Use Case: The Policy defines a target source http://example.com/media-catalogue that is an
AssetCollection of multimedia videos. The target also has a refinement that specifies the characteristics of the
AssetCollection members. In this case, the target subset of Assets will be those that have a running time of less than
60 minutes, and each of those may be played. Note that the runningTime leftOperand is defined in the ODRL Profile
http://example.com/odrl:profile:11 together with the play action.
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Offer",
    "uid": "http://example.com/policy:88",
    "profile": "http://example.com/odrl:profile:10",
    "permission": [{
        "target": "http://example.com/book/1999",
        "assigner": "http://example.com/org/paisley-park",
        "action": [{
           "rdf:value": { "@id": "odrl:reproduce" },
           "refinement": {
               "xone": { 
           "@list": [ 
       { "@id": "http://example.com/p:88/C1" },
                       { "@id": "http://example.com/p:88/C2" } 
   ]
       }
            }
        }]
    }]
}
 
{
   "@context": "http://www.w3.org/ns/odrl.jsonld",
   "@type": "Constraint",
   "uid": "http://example.com/p:88/C1",
   "leftOperand": "media",
   "operator": "eq",
   "rightOperand": { "@value": "online", "@type": "xsd:string" }
}
 
{
   "@context": "http://www.w3.org/ns/odrl.jsonld",
   "@type": "Constraint",
   "uid": "http://example.com/p:88/C2",
   "leftOperand": "media",
   "operator": "eq",
   "rightOperand": { "@value": "print", "@type": "xsd:string" }
}
NOTE
When using the refinement property with an Action, the rdf:value property is used to represent the instance of the
Action which MUST use its namespace identifier (eg odrl), and assert it is an @id key. In addition, identifiers of
Constraint instances (for logical constraint operands) must assert them as an @id key.
