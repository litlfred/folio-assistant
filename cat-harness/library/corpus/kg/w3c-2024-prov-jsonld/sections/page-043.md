---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-043
section_title: "Page 43"
pages: 43-43
pdf_page: 43
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
Context for Communication
{
"Communication": {
    "@id": "prov:Communication",
    "@context": {
"informed": {
    "@reverse" : "prov:qualifiedCommunication",
    "@type" : "@id"
},
"informant": {
    "@id": "prov:activity",
    "@type": "@id"
}
    }
}
}
In the mapping Context for Influence, the JSON properties influencee and influencer map to the object
properties prov:qualifiedInfluence and prov:influencer, respectively.
Context for Influence
{
"Influence": {
    "@id": "prov:Influence",
    "@context": {
"influencee": {
    "@reverse" : "prov:qualifiedInfluence",
    "@type" : "@id"
},
"influencer": {
    "@id": "prov:influencer",
    "@type": "@id"
}
§ 5.16 Influence
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
43/71
