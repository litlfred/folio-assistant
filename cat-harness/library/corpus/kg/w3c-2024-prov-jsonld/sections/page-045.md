---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-045
section_title: "Page 45"
pages: 45-45
pdf_page: 45
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
Definition Context for Alternate). However, the mapping is to new classes and properties in the PROV
extension namespace (denoted by the prefix provext). See Section 6 for interoperability
considerations.
The JSON properties alternate1 and alternate2 map to the object properties provext:qualifiedAlternate
and provext:alternate, respectively.
Context for Alternate
{
"Alternate": {
    "@id": "provext:Alternate",
    "@context": {
"alternate1": {
    "@reverse" : "provext:qualifiedAlternate",
    "@type" : "@id"
},
"alternate2": {
    "@id": "provext:alternate",
    "@type": "@id"
}
    }
}
}
While [PROV-O] does not define a Qualification Pattern for Membership, for uniformity and usability
reasons, we adopt a similar mapping as other PROV relations, via a Qualification Pattern (see
Definition Context for Membership). However, the mapping is to new classes and properties in the
PROV extension namespace (denoted by the prefix provext). See Section 6 for interoperability
considerations.
The JSON properties collection and entity map to the object properties provext:qualifiedMembership
and provext:member, respectively.
§ 5.19 Membership
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
45/71
