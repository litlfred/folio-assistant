---
doc_id: w3c-2018-odrl-model-2-2
doc_title: "ODRL Information Model 2.2 W3C Recommendation 15 February 2018 This version: Latest published version: Latest editor's draft: Implementation report: Previous version: Editors:"
section_id: sec-020-223-target-policy-property
section_title: "Target Policy Property"
section_number: 2.2.3
pages: 9-10
source_pdf: w3c-2018-odrl-model-2-2.pdf
source_sha256: 6d70216ccdd8df7b
toc_source: outline
---
An ODRL Policy class MAY also be referenced by the hasPolicy property. This supports ODRL Policy Rules being the object of
external metadata expressions (that identifies an Asset). When hasPolicy has been asserted between a metadata expression and
an ODRL Policy, the Asset being identified MUST be inferred to be the target Asset of all the Rules of that Policy. If there are
multiple Rules in the Policy, then the inferred Asset will be the target Asset to every Rule in the Policy.
Example Use Case: The below snippet shows some Dublin Core metadata describing a movie Asset. The
odrl:hasPolicy property links to the ODRL Policy http://example.com/policy:1010 (this is the Set Policy
described above). In this case, the Asset http://example.com/asset:9999.movie is now also the target Asset for
the Permission in Policy http://example.com/policy:1010. If there were additional Rules in this Policy, then the
same Asset would be the target Asset to each Rule.
EXAMPLE 5
{
   "@context": "http://www.w3.org/ns/odrl.jsonld",
   "@type": "Policy",
   "uid": "http://example.com/policy:1011",
   "profile": "http://example.com/odrl:profile:03",
   "permission": [{
       "target": {
           "@type": "AssetCollection",
           "uid":  "http://example.com/archive1011" },
       "action": "index",
       "summary": "http://example.com/x/database"
   }]
}
EXAMPLE 6
{
   "@type": "dc:Document",
   "@id": "http://example.com/asset:111.doc",
   "dc:title": "Annual Report",
   ...
   "odrl:partOf": "http://example.com/archive1011",
   ...
}
EXAMPLE 7
{
   "@type": "dc:MovingImage",
   "@id": "http://example.com/asset:9999.movie",
