---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-132-104-the-rdfcompoundliteral-class-and-the-rdflang
section_title: "The rdf:CompoundLiteral class and the rdf:language and rdf:direction properties"
section_number: 10.4
pages: 84-85
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
For improved interoperability, the language tag is normalized to lower case when creating the datatype IRI.
The following example shows two statements with compound literals representing strings with the language tag ar-EG and base direction rtl.
@prefix ex: <http://example.org/> .
# Note that this version preserves the base direction using a bnode structure.
[
  ex:title [
    rdf:value "HTML و CSS: تصميم و إنشاء مواقع الويب",
    rdf:language "ar-eg",
    rdf:direction "rtl"
  ];
  ex:publisher [
    rdf:value "مكتبة",
    rdf:language "ar-eg",
    rdf:direction "rtl"
  ]
] .
See § 4.2.4.1 Base Direction for more details on using base direction for strings.
