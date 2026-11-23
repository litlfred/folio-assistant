---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-046
section_title: "Page 46"
pages: 46-46
pdf_page: 46
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
Context for Membership
{
"Membership": {
    "@id": "provext:Membership",
    "@context": {
"collection": {
    "@reverse" : "provext:qualifiedMembership",
    "@type" : "@id"
},
"entity": {
    "@id": "provext:member",
    "@type": "@id"
}
    }
}
}
IC1:
There are differences between PROV-DM and PROV-O in terms of the level of requirements set
on some expressions. For instance, PROV-DM mandates the presence of an entity in a
generation, whereas it defines an activity as optional. Compliance requirements are not the same
in PROV-O as one could define a qualified generation with an activity but without an entity.
Experience shows that there may be good reasons why a generation may not refer to an entity; for
instance, because the recorded provenance is not "complete" yet, and further provenance
expressions still need to be asserted, received or merged; in the meantime, we still want to be able
to process such provenance, even if "incomplete". Thus, in PROV-JSONLD, the presence of an
entity and an activity in a generation expression is RECOMMENDED (we use the term
SHOULD), while other properties are optional (we use the term MAY), and its @type is
REQUIRED (we use the term MUST).
IC2:
In PROV-DM, all relations are n-ary except for specialization, alternate and membership, which
are binary, meaning that no identifier or extra properties are allowed for these. In PROV-O, this
design decision translates to the lack of qualified relations for specialization, alternate and
membership. In PROV-JSONLD, in order to keep the regular structure of JSON objects and the
natural encoding of relations, but also to ensure the simplicity and efficiency of parsers, these
§ 6. Interoperability Considerations
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
46/71
