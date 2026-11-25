---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-047-28-policy-metadata
section_title: "Policy Metadata"
section_number: 2.8
pages: 27-28
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
Additional metadata properties MAY be added to a Policy to support further authenticity, and integrity purposes from external
vocabularies. The ODRL Information Model recommends the use of Dublin Core Metadata Terms [dcterms] for ODRL Policies.
The following Dublin Core Metadata Terms [dcterms] properties SHOULD be used:
none, one, or many dc:creator property values - the individual, agent, or organisation that authored the Policy.
none, one, or many dc:description property values - a human-readable representation or summary of the Policy.
none or one dc:issued property values - the date (and time) the Policy was first issued.
none or one dc:modified property values - the date (and time) the Policy was updated.
none, one, or many dc:coverage property values - the jurisdiction under which the Policy is relevant.
none or one dc:replaces property values (of type Policy) - the identifier of a Policy that this Policy supersedes.
none or one dc:isReplacedBy property values (of type Policy) - the identifier of a Policy that supersedes this Policy.
The ODRL validation requirements for Policies with the above metadata properties include:
1. If a Policy has the dc:isReplacedBy property, then a processor MUST consider the first Policy void and MUST retrieve
and process the identified Policy.
Example Use Case: The below example shows metadata properties that indicate who created the Policy, a
description, when the Policy was issued, which jurisdiction (an identifier of Queensland, Australia) the Policy applies
to, and an identifier of an older version of the Policy it replaces.
        "assignee": "http://example.com/people/murphy"
        }]
}  
EXAMPLE 29
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:8888",
    "profile": "http://example.com/odrl:profile:21",
    "permission": [{
        "assignee": "http://example.com/people/billie",
        "target": "http://example.com/music/1999.mp3",
        "assigner": "http://example.com/org/sony-music",
        "action": "play"
        },
        {
        "assignee": "http://example.com/people/murphy",
        "target": "http://example.com/music/1999.mp3",
        "assigner": "http://example.com/org/sony-music",
        "action": "play",
        }]
}  
EXAMPLE 30
{
    "@context": [
        "http://www.w3.org/ns/odrl.jsonld",
        { "dc": "http://purl.org/dc/terms/" }
    ],
    "@type": "Policy",
    "uid": "http://example.com/policy:8888",
    "profile": "http://example.com/odrl:profile:22",
    "dc:creator": "Billie Enterprises LLC",
Note: The string values used in the Dublin Core metadata properties are not designed for comparison of Policy metadata, as they
may not be normalised.
