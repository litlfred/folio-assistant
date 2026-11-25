---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-130-note
section_title: "Note"
section_number: null
pages: 84-84
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
[
  ex:title "HTML و CSS: تصميم و إنشاء مواقع الويب"^^i18n:ar-eg_rtl;
  ex:publisher "مكتبة"^^i18n:ar-eg_rtl
] .
See § 4.2.4.1 Base Direction for more details on using base direction for strings.
This section is non-normative.
This specification defines the rdf:CompoundLiteral class, which is in the domain of rdf:language and rdf:direction to be used for describing
RDF literal values containing base direction and a possible language tag to be associated with the string value of rdf:value on the same subject.
rdf:CompoundLiteral
A class representing a compound literal.
rdf:language
An RDF property. The range of the property is an rdfs:Literal, whose value MUST be a well-formed [BCP47] language tag. The domain of the
property is rdf:CompoundLiteral.
rdf:direction
An RDF property. The range of the property is an rdfs:Literal, whose value MUST be either "ltr" or "rtl". The domain of the property is
rdf:CompoundLiteral.
The Deserialize JSON-LD to RDF Algorithm can be used with the rdfDirection option set to compound-literal to generate RDF literals using these
properties to describe the base direction and optional language tag (normalized to lower case) from value objects containing @direction and
optionally @language.
