---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-037
section_title: "Page 37"
pages: 37-37
pdf_page: 37
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
The mapping Context for Attribution supports the Qualification Pattern of Figure 2, i. The JSON
property entity maps to the object property prov:qualifiedAttribution.
Context for Attribution
{
"Attribution": {
    "@id": "prov:Attribution",
    "@context": {
"entity": {
    "@reverse" : "prov:qualifiedAttribution",
    "@type" : "@id"
}
    }
}
}
The mapping Context for Association supports the Qualification Pattern of Figure 2, j. The JSON
properties activity and plan map to the object properties prov:qualifiedAssociation and prov:hadPlan,
respectively.
Context for Association
{
"Association": {
    "@id": "prov:Association",
    "@context": {
"activity": {
    "@reverse" : "prov:qualifiedAssociation",
    "@type" : "@id"
},
"plan": {
§ 5.7 Attribution
§ 5.8 Association
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
37/71
