---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-046-271-compact-policy
section_title: "Compact Policy"
section_number: 2.7.1
pages: 26-27
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An ODRL Policy MAY hold properties, declared at the Policy-level, which are shared and common to all its Rules. This is aimed
only as a short-cut method to support more compact serialisations. These shared properties MUST NOT be interpreted as Policy-
level properties (such as those defined in the Policy Class section).
Properties that MAY be shared (as shown in the figure below) include:
One or many action properties.
One or many sub-properties of relation (such as target).
One or many sub-properties of function (such as assigner and assignee).
Figure 4 ODRL Shared Properties (Also available in SVG format)
The ODRL validation requirements for expanding short-cuts in a Policy is:
1. For each Rule in the Policy:
Verify any relevant shared properties (at the Policy-level).
Replicate these properties in the Rule.
2. Remove the shared properties declared at the Policy-level
Further, follow the ODRL validation requirements to create atomic Rules in the Policy (defined in the previous section).
It is RECOMMENDED that compact ODRL Policies be expanded to atomic Policies when being processed for conformance.
The example below shows such shared common properties applied to a Policy:
EXAMPLE 28
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Policy",
    "uid": "http://example.com/policy:8888",
    "profile": "http://example.com/odrl:profile:21",
    "target": "http://example.com/music/1999.mp3",
    "assigner": "http://example.com/org/sony-music",
    "action": "play",
    "permission": [{
        "assignee": "http://example.com/people/billie"
        },
        {
The example below shows how these shared properties are expanded to the Permissions of the Policy following the ODRL
validation requirements above.
