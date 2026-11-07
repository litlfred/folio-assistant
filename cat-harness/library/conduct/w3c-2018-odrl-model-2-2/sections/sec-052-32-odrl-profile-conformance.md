---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-052-32-odrl-profile-conformance
section_title: "ODRL Profile Conformance"
section_number: 3.2
pages: 30-31
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
EXAMPLE 34
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:0001",
    "profile": "http://example.com/odrl:profile:40",
    "conflict": "perm",
    "permission": [{
        "target": "http://example.com/asset:1212",
        "action": "use",
        "assigner": "http://example.com/owner:181"
    }]
}
EXAMPLE 35
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:0002",
    "profile": "http://example.com/odrl:profile:40",
    "conflict": "perm",
    "permission": [{
        "target": "http://example.com/asset:1212",
        "action": "display",
        "assigner": "http://example.com/owner:182"
    }],
    "prohibition": [{
        "target": "http://example.com/asset:1212",
        "action": "print"
    }]
}
If an ODRL Policy conforms to an ODRL Profile, then the profile property MUST be specified to indicate the identifier (IRI) of
the ODRL Profile. There MAY be multiple identifiers used to indicate that an ODRL Policy conforms to multiple ODRL Profiles.
When an ODRL Profile(s) is used in an ODRL Policy, an ODRL Processing system MUST understand the semantics of the
identified ODRL Profile(s). If the ODRL Processing system does not recognise the ODRL Profile identifier(s) then it MUST stop
processing the policy.
