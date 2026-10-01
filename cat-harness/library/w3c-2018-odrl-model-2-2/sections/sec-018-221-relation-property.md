---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-018-221-relation-property
section_title: "Relation Property"
section_number: 2.2.1
pages: 8-9
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The abstract relation property is used to create an explicit link between an Action and an Asset, indicating how the Asset MUST
be utilised in respect to the Rule that links to it.
An ODRL validator MUST support the following sub-properties of relation:
target: indicates that the Asset is the primary subject to which the Rule action directly applies.
Additional relation subtype properties MAY be defined in the ODRL Common Vocabulary [odrl-vocab] and ODRL Profiles.
Example Use Case: The assigner Party http//example.com/party:0001 offers to display the target Asset
http://example.com/asset:3333.
Example Use Case: The below Policy shows the index action Permission on the target Asset
http://example.com/archive1011. The target asset is also declared as an AssetCollection to indicate the
NOTE
If an Asset does not assert an identifier using the uid property, then the full implications must be understood, such as the
impact on ODRL Validators and Evaluators of ODRL Policies.
EXAMPLE 4
{
   "@context": "http://www.w3.org/ns/odrl.jsonld",
   "@type": "Offer",
   "uid": "http://example.com/policy:3333",
   "profile": "http://example.com/odrl:profile:02",
   "permission": [{
       "target": "http://example.com/asset:3333",
       "action": "display",
       "assigner": "http://example.com/party:0001"
   }]
}
NOTE
In the above example, the JSON-LD representation for the relation property directly uses target as the token, as this
has been defined as a subtype of the parent relation property.
resource is a collection of resources. An additional Asset relation summary indicates the Asset
http://example.com/x/database that the indexing output should be stored in. The ODRL Profile
ttp://example.com/odrl:profile:03 defines this new sub-property of relation.
