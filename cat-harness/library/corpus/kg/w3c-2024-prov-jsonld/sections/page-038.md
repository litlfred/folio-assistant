---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-038
section_title: "Page 38"
pages: 38-38
pdf_page: 38
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"@id": "prov:hadPlan",
    "@type": "@id"
}
    }
}
}
The mapping Context for Delegation supports the Qualification Pattern of Figure 2, h. The JSON
properties responsible, delegate and activity map to the object properties prov:agent,
prov:qualifiedDelegation and prov:hadActivity, respectively.
Context for Delegation
{
"Delegation": {
    "@id": "prov:Delegation",
    "@context": {
"responsible": {
    "@id": "prov:agent",
    "@type" : "@id"
},
"delegate": {
    "@reverse": "prov:qualifiedDelegation",
    "@type": "@id"
},
"activity": {
    "@id" : "prov:hadActivity",
    "@type" : "@id"
}
    }
}
}
§ 5.9 Delegation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
38/71
