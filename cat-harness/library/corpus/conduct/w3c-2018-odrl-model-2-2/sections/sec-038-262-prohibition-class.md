---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-038-262-prohibition-class
section_title: "Prohibition Class"
section_number: 2.6.2
pages: 20-21
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
A Prohibition disallows an action, with all refinements satisfied, to be exercised on an Asset if all constraints are satisfied. If the
Prohibition has been infringed by the action being exercised, then all of the remedies MUST be fulfilled to set the state of the
Prohibition to not infringed.
The Prohibition class is a subclass of, and inherits all the properties from, the Rule class - and has the following additional
property semantics:
A Prohibition MUST have one target property value of type Asset. (Other relation sub-properties MAY be used.)
A Prohibition MAY have none or one assigner and/or assignee property values (of type Party) for functional roles. (Other
function sub-properties MAY be used.)
A Prohibition MAY have none, one, or more remedy property values of type Duty.
Note: The above property cardinalities reflect the normative ODRL Information Model. In some cases, repeat occurrences of
some properties are also supported (as described in Policy Rule Composition and Compact Policy) but the normative atomic
Policy is consistent with the above property cardinalities.
The remedy property (a sub-property of the failure property) expresses an agreed obligation that MUST be fulfilled in the case
that the Prohibition has been infringed. That is, the remedy property asserts a Duty that must be fulfilled if the action of the
Prohibition is exercised. See the Remedy with a Prohibition section for more details.
Example Use Case: The assigner of a target Asset http://example.com/photoAlbum:55 expresses an Agreement
Policy with both a Permission and a Prohibition. The assigner Party http://example.com/MyPix:55 assigns the
Permission display to the assignee Party http://example.com/assignee:55 at the same time a Prohibition to
archive the target Asset. Additionally, in case of any conflicts in the Policy (e.g., between Permissions and
Prohibitions), the conflict property of the Policy is set to perm indicating that the Permissions will take
precedence.
EXAMPLE 18
{
   "@context": "http://www.w3.org/ns/odrl.jsonld",
   "@type": "Offer",
   "uid": "http://example.com/policy:9090",
   "profile": "http://example.com/odrl:profile:07",
   "permission": [{
       "target": "http://example.com/game:9090",
       "assigner": "http://example.com/org:xyz",
       "action": "play",
       "constraint": [{
           "leftOperand": "dateTime",
           "operator": "lteq",
           "rightOperand": { "@value": "2017-12-31", "@type": "xsd:date" }
       }]
   }]
}
EXAMPLE 19
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Agreement",
    "uid": "http://example.com/policy:5555",
    "profile": "http://example.com/odrl:profile:08",
    "conflict": "perm",
    "permission": [{
        "target": "http://example.com/photoAlbum:55",
        "action": "display",
        "assigner": "http://example.com/MyPix:55",
        "assignee": "http://example.com/assignee:55"
