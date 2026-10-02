---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-129-issue
section_title: "Issue"
section_number: null
pages: 84-84
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The JSON Canonicalization Scheme (JCS) [RFC8785] is an emerging standard for JSON canonicalization. This specification will likely be updated
to require such a canonical representation. Users are cautioned from depending on the JSON literal lexical representation as an RDF literal, as the
specifics of serialization may change in a future revision of this document.
Despite being defined as a set of strings, this value space is considered distinct from the value space of xsd:string, in order to avoid side effects
with existing specifications.
The lexical-to-value mapping
maps any element of the lexical space to the result of
1. parsing it into an internal representation consistent with [ECMASCRIPT] representation created by using the JSON.parse function as defined
in Section 24.5 The JSON Object of [ECMASCRIPT],
2. then serializing it in the JSON format [RFC8259] in compliance with the constraints of the value space described above.
The canonical mapping
maps any element of the value space to the identical string in the lexical space.
This section is non-normative.
The i18n namespace is used for describing combinations of language tag and base direction in RDF literals. It is used as an alternative mechanism for
describing the [BCP47] language tag and base direction of RDF literals that would otherwise use the xsd:string or rdf:langString datatypes.
Datatypes based on this namespace allow round-tripping of JSON-LD documents using base direction, although the mechanism is not otherwise
standardized.
The Deserialize JSON-LD to RDF Algorithm can be used with the rdfDirection option set to i18n-datatype to generate RDF literals using the i18n
base to create an IRI encoding the base direction along with optional language tag (normalized to lower case) from value objects containing
@direction by appending to https://www.w3.org/ns/i18n# the value of @language, if any, followed by an underscore ("_") followed by the value
of @direction.
For improved interoperability, the language tag is normalized to lower case when creating the datatype IRI.
The following example shows two statements with literal values of i18n:ar-EG_rtl, which encodes the language tag ar-EG and the base direction
rtl.
@prefix ex: <http://example.org/> .
@prefix i18n: <https://www.w3.org/ns/i18n#> .
