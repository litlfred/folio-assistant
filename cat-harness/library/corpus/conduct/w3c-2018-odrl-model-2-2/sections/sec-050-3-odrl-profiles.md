---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-050-3-odrl-profiles
section_title: "ODRL Profiles"
section_number: 3
pages: 29-30
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
The Conflict Strategy requirements include:
1. If a Policy has the conflict property of perm then any conflicting Permission Rule MUST override the Prohibition Rule.
2. If a Policy has the conflict property of prohibit then any conflicting Prohibition Rule MUST override the Permission
Rule.
3. If a Policy has the conflict property of invalid then any conflicting Rules MUST void the entire Policy.
4. If a Policy has multiple conflict property values (for example, after a Policy merge or inheritance) and there are
conflicting Rules then the entire Policy MUST be void.
Example Use Case: Two Policies are associated to the same target Asset http://example.com/asset:1212. The
first Policy http://example.com/policy:0001 allows to use the Asset. The second Policy
EXAMPLE 33
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:4444",
    "profile": "http://example.com/odrl:profile:30",
    "inheritFrom": "http://example.com/policy:default",
    "permission": [{
        "target": "http://example.com/asset:5555",
        "action": "display",
        "assigner": "http://example.com/org-01",
        "assignee": "http://example.com/user:0001"
    }],
    "obligation": [{
        "target": "http://example.com/asset:terms-and-conditions",
        "action": "reviewPolicy",
        "assigner": "http://example.com/org-01",
        "assignee": "http://example.com/user:0001"
    }]
}
http://example.com/policy:0002 allows for the display of the Asset, but it prohibits print. Both policies
explicitly state how to deal with conflicts through the conflict property being set to perm. Hence the Permissions
will always override any Prohibitions. In this use case, since the print Action is a specialisation of the use Action,
there could be a conflict. However, the perm conflict strategy means that the use Permission will override the print
Prohibition.
In the above use case, if the second Policy had the conflict value of prohibit, then the outcome would be a direct contradiction,
and the result will be an void Policy.
3. ODRL Profiles
