---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-017-22-asset-class
section_title: "Asset Class"
section_number: 2.2
pages: 7-8
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An Asset class is a resource or a collection of resources that are the subject of a Rule. The Asset can be any form of identifiable
resource, such as data/information, content/media, applications, services, or physical artefacts. Furthermore, it can be used to
represent other Asset classes that are needed to undertake the Policy expression, such as with a Duty. An Asset is referred to by
the Permission and/or Prohibition, and also by the Duty.
The Asset class has the following properties:
An Asset SHOULD have one uid property value (of type IRI [rfc3987]) to identify the Asset.
    "uid": "http://example.com/policy:1011",
    "profile": "http://example.com/odrl:profile:01",
    "permission": [{
        "target": "http://example.com/asset:9898.movie",
        "assigner": "http://example.com/party:org:abc",
        "action": "play"
    }]
}
NOTE
The above example uses the profile property to indicate that the terms used are defined by the ODRL Profile identified
by http://example.com/odrl:profile:01. See the ODRL Profiles section for more details.
EXAMPLE 3
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:1012",
    "profile": "http://example.com/odrl:profile:01",
    "permission": [{
        "target": "http://example.com/asset:9898.movie",
        "assigner": "http://example.com/party:org:abc",
        "assignee": "http://example.com/party:person:billie",
        "action": "play"
    }]
}
An Asset MAY have none, one, or many partOf property values (of type AssetCollection) to identify the AssetCollection
that this Asset is in a collection of.
The Asset class has the following subclass:
AssetCollection - an Asset that is a single resource representing a set of member resources. This indicates that all the
members of the set will be the subject of the Rule.
An AssetCollection class has the following properties:
An AssetCollection MAY have one source property value (of type IRI [rfc3987]) to reference the AssetCollection.
An AssetCollection MAY have none, one, or many refinement property values of type Constraint. See Refinement
property with an Asset Collection for more details.
Since ODRL Policies could deal with any kind of Asset, the ODRL Information Model does not provide additional metadata to
describe Assets of particular media types. It is recommended to use existing metadata standards, such as Dublin Core Metadata
Terms that are appropriate to the Asset type or purpose.
