---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-019-2-conformance
section_title: "Conformance"
section_number: 2
pages: 10-11
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
As well as sections marked as non-normative, all authoring guidelines, diagrams, examples, and notes in this specification are non-normative.
Everything else in this specification is normative.
The key words MAY, MUST, MUST NOT, RECOMMENDED, SHOULD, and SHOULD NOT in this document are to be interpreted as described in
BCP 14 [RFC2119] [RFC8174] when, and only when, they appear in all capitals, as shown here.
A JSON-LD document complies with this specification if it follows the normative statements in appendix § 9. JSON-LD Grammar. JSON documents
can be interpreted as JSON-LD by following the normative statements in § 6.1 Interpreting JSON as JSON-LD. For convenience, normative
statements for documents are often phrased as statements on the properties of the document.
This specification makes use of the following namespace prefixes:
Prefix
IRI
dc11
http://purl.org/dc/elements/1.1/
dcterms
http://purl.org/dc/terms/
cred
https://w3id.org/credentials#
foaf
http://xmlns.com/foaf/0.1/
geojson
https://purl.org/geojson/vocab#
prov
http://www.w3.org/ns/prov#
i18n
https://www.w3.org/ns/i18n#
rdf
http://www.w3.org/1999/02/22-rdf-syntax-ns#
schema
http://schema.org/
skos
http://www.w3.org/2004/02/skos/core#
xsd
http://www.w3.org/2001/XMLSchema#
These are used within this document as part of a compact IRI as a shorthand for the resulting IRI, such as dcterms:title used to represent
http://purl.org/dc/terms/title.
This section is non-normative.
JSON [RFC8259] is a lightweight, language-independent data interchange format. It is easy to parse and easy to generate. However, it is difficult to
integrate JSON from different sources as the data may contain keys that conflict with other data sources. Furthermore, JSON has no built-in support
for hyperlinks, which are a fundamental building block on the Web. Let's start by looking at an example that we will be using for the rest of this
section:
It's obvious to humans that the data is about a person whose name is "Manu Sporny" and that the homepage property contains the URL of that person's
homepage. A machine doesn't have such an intuitive understanding and sometimes, even for humans, it is difficult to resolve ambiguities in such
representations. This problem can be solved by using unambiguous identifiers to denote the different concepts instead of tokens such as "name",
"homepage", etc.
Linked Data, and the Web in general, uses IRIs (Internationalized Resource Identifiers as described in [RFC3987]) for unambiguous identification.
The idea is to use IRIs to assign unambiguous identifiers to data that may be of use to other developers. It is useful for terms, like name and homepage,
to expand to IRIs so that developers don't accidentally step on each other's terms. Furthermore, developers and machines are able to use this IRI (by
using a web browser, for instance) to go to the term and get a definition of what the term means. This process is known as IRI dereferencing.
Leveraging the popular schema.org vocabulary, the example above could be unambiguously expressed as follows:
