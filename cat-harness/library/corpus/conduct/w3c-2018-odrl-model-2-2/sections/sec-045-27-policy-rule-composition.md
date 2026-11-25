---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-045-27-policy-rule-composition
section_title: "Policy Rule Composition"
section_number: 2.7
pages: 24-26
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The ODRL Information Model provides the normative cardinalities for property relationships to Rules. At the core level, an
ODRL Rule would be related to one Asset, one or more Party functional roles, one Action (and potentially to Constraints and/or
Duties)
The Policy Rules Composition permits each Rule to extend the cardinality requirements of the ODRL Information Model to
support a Rule being related to multiple Assets, Parties, and Actions. The purpose is to combine common properties (in a single
Rule) to express a more compound Policy. The Policy SHOULD then be processed into its normative atomic equivalent.
The example below shows the atomic level of a Policy where it is an irreducible Rule (that is, not able to be reduced
or further simplified).
    "permission": [{
        "target": "http://example.com/data:77",
        "assigner": "http://example.com/org:99",
        "assignee": "http://example.com/person:88",
        "action": "distribute",
        "duty": [{
            "action": "attribute",
            "attributedParty": "http://australia.gov.au/",
            "consequence": [{
               "action": "acceptTracking",
               "trackingParty": "http://example.com/dept:100"
            }]
        }]
    }]
}
EXAMPLE 24
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:33CC",
    "profile": "http://example.com/odrl:profile:09",
    "prohibition": [{
        "target": "http://example.com/data:77",
        "assigner": "http://example.com/person:88",
        "assignee": "http://example.com/org:99",
        "action": "index",
        "remedy": [{
            "action": "anonymize",
            "target": "http://example.com/data:77"
        }]
    }]
}
EXAMPLE 25
The below example Policy includes two target Assets and two actions in the same permission Rule.
The above example can then be reduced to four atomic permission Rules. Each permission Rule will include a single
target and a single action.
In order to create the atomic Rules in a Policy, the ODRL validation requirements for Rules with multiple Assets, Parties, and
Actions includes:
{
  "@context": "http://www.w3.org/ns/odrl.jsonld",
  "@type": "Policy",
  "uid": "http://example.com/policy:7777",
  "profile": "http://example.com/odrl:profile:20",
  "permission": [{
    "target": "http://example.com/music/1999.mp3",
    "assigner": "http://example.com/org/sony-music",
    "action": "play"
  }]
} 
EXAMPLE 26
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:8888",
    "profile": "http://example.com/odrl:profile:20",
    "permission": [{
        "target": [ "http://example.com/music/1999.mp3",
                    "http://example.com/music/PurpleRain.mp3" ],
        "assigner": "http://example.com/org/sony-music",
        "action": [ "play", "stream" ]
    }]
}
EXAMPLE 27
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:8888",
    "profile": "http://example.com/odrl:profile:20",
    "permission": [{
        "target": "http://example.com/music/1999.mp3",
        "assigner": "http://example.com/org/sony-music",
        "action": "play"
    },
    {
        "target": "http://example.com/music/1999.mp3",
        "assigner": "http://example.com/org/sony-music",
        "action": "stream"
    },
{
        "target": "http://example.com/music/PurpleRain.mp3",
        "assigner": "http://example.com/org/sony-music",
        "action": "play"
    },
{
        "target": "http://example.com/music/PurpleRain.mp3",
        "assigner": "http://example.com/org/sony-music",
        "action": "stream"
    }]
}
1. Where there are multiple Assets (with the same relation), then replace the existing Rule by newly created Rules (one for
each of these Assets) and include only one Asset relation, and include all other (non-Asset) properties, in each Rule
2. Where there are multiple Parties (with the same function), then replace the existing Rule by newly created Rules (one for
each of these Parties) and include only one Party function, and include all other (non-Party) properties, in each Rule.
3. Where there are multiple Actions, then replace the existing Rule by newly created Rules (one for each of these Actions)
and include only one Action, and include all other (non-Action) properties, in each Rule.
