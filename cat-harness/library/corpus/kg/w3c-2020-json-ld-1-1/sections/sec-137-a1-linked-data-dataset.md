---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-137-a1-linked-data-dataset
section_title: "A.1 Linked Data Dataset"
section_number: null
pages: 85-86
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Alice
an RDF literal with no datatype or language.
weiblich | de
an language-tagged string with the value "weiblich" and language tag "de".
female | en
an language-tagged string with the value "female" and language tag "en".
The second and third boxes describe two named graphs, with the graph names "http://example.com/graphs/1" and "http://example.com/graphs/1",
respectively.
The second box consists of two resources: http://example.com/people/alice and http://example.com/people/bob related by the
schema:parent relationship, and names the http://example.com/people/bob "Bob".
The third box consists of two resources, one named http://example.com/people/bob and the other unnamed. The two resources related to each
other using schema:sibling relationship with the second named "Mary".
This section is non-normative.
The JSON-LD examples below demonstrate how JSON-LD can be used to express semantic data marked up in other linked data formats such as
Turtle, RDFa, and Microdata. These sections are merely provided as evidence that JSON-LD is very flexible in what it can express across different
Linked Data approaches.
This section is non-normative.
The following are examples of transforming RDF expressed in [Turtle] into JSON-LD.
The JSON-LD context has direct equivalents for the Turtle @prefix declaration:
Both [Turtle] and JSON-LD allow embedding, although [Turtle] only allows embedding of blank nodes.
