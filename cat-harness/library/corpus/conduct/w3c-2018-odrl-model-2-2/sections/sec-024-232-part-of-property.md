---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-024-232-part-of-property
section_title: "Part Of Property"
section_number: 2.3.2
pages: 11-12
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The partOf property is used to identify a PartyCollection that a Party entity is a member of. The purpose is to explicitly express
membership relationships between Parties and PartyCollections. This enables a Rule that relates to a PartyCollection to
understand which individual Parties the Rule may apply to. In addition, the Party/PartyCollection membership relationships may
potentially detect conflicts in Rules.
Example Use Case: The below snippet shows some vCard metadata describing a Party. The odrl:partOf property
asserts that the Party http://example.com/person/murphy is a member of the http://example.com/team/A
PartyCollection which is used in the Policy in the example above. This means that
http://example.com/person/murphy is an assignee and can use the target asset in the Policy.
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:8888",
    "profile": "http://example.com/odrl:profile:04",
    "permission": [{
        "target": "http://example.com/music/1999.mp3",
        "assigner": "http://example.com/org/sony-music",
        "assignee": "http://example.com/people/billie",
        "action": "play"
    }]
}  
NOTE
In the above example, the JSON-LD representation for function directly uses assigner and assignee as the token, as
this has been defined as sub-properties of the parent function property.
EXAMPLE 9
{
    "@context": [
        "http://www.w3.org/ns/odrl.jsonld",
        { "vcard": "http://www.w3.org/2006/vcard/ns#" }
    ],
    "@type": "Agreement",
    "uid": "http://example.com/policy:777",
    "profile": "http://example.com/odrl:profile:05",
    "permission": [{
        "target": "http://example.com/looking-glass.ebook",
        "assigner": {
            "@type": [ "Party", "vcard:Organization" ],
            "uid":  "http://example.com/org/sony-books",
            "vcard:fn": "Sony Books LCC",
            "vcard:hasEmail": "sony-contact@example.com" },
        "assignee": {
            "@type": [ "PartyCollection", "vcard:Group" ],
            "uid":  "http://example.com/team/A",
            "vcard:fn": "Team A",
            "vcard:hasEmail": "teamA@example.com"},
        "action": "use"
    }]
}
