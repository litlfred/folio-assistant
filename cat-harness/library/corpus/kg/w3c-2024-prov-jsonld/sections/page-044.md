---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-044
section_title: "Page 44"
pages: 44-44
pdf_page: 44
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
}
}
}
While [PROV-O] does not define a Qualification Pattern for Specialization, for uniformity and
usability reasons, we adopt a similar mapping as other PROV relations, via a Qualification Pattern (see
Definition Context for Specialization). However, the mapping is to new classes and properties in the
PROV extension namespace (denoted by the prefix provext). See Section 6 for interoperability
considerations.
The JSON properties specificEntity and generalEntity map to the object properties
provext:qualifiedSpecialization and provext:generalEntity, respectively.
Context for Specialization
{
"Specialization": {
    "@id": "provext:Specialization",
    "@context": {
"specificEntity": {
    "@reverse" : "provext:qualifiedSpecialization",
    "@type" : "@id"
},
"generalEntity": {
    "@id": "provext:generalEntity",
    "@type": "@id"
}
    }
}
}
While [PROV-O] does not define a Qualification Pattern for Alternate, for uniformity and usability
reasons, we adopt a similar mapping as other PROV relations, via a Qualification Pattern (see
§ 5.17 Specialization
§ 5.18 Alternate
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
44/71
