---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-014-note
section_title: "NOTE"
section_number: null
pages: 6-7
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
Note: The above property cardinalities reflect the normative ODRL Information Model. In some cases, repeat occurrences of
some properties are also supported (as described in Policy Rule Composition and Compact Policy) but the normative atomic
Policy is consistent with the above property cardinalities.
Example Use Case: The below Offer Policy (based on the previous example) shows the Permission to play the
target Asset http//example.com/asset:9898.movie from the assigner Party
http://example.com/party:org:abc.
EXAMPLE 1
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Set",
    "uid": "http://example.com/policy:1010",
    "permission": [{
        "target": "http://example.com/asset:9898.movie",
        "action": "use"
    }]
}
NOTE
For the examples in this document, the ODRL Policy subclasses are mapped to the JSON-LD @type tokens. The above
example could have also used Policy type instead of Set type (as they are equivalent).
The above example does not use the profile property as all the terms are defined by the ODRL Core Vocabulary [odrl-
vocab].
EXAMPLE 2
{
    "@context": "http://www.w3.org/ns/odrl.jsonld",
    "@type": "Offer",
