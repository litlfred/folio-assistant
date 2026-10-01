---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-125-note
section_title: "Note"
section_number: null
pages: 82-82
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The use of blank node identifiers to label properties is obsolete, and may be removed in a future version of JSON-LD, as is the support for
generalized RDF Datasets.
Summarized, these differences mean that JSON-LD is capable of serializing any RDF graph or dataset and most, but not all, JSON-LD documents
can be directly interpreted as RDF as described in RDF 1.1 Concepts [RDF11-CONCEPTS].
Authors are strongly encouraged to avoid labeling properties using blank node identifiers, instead, consider one of the following mechanisms:
a relative IRI reference, either relative to the document or the vocabulary (see § 4.1.4 Using the Document Base for the Default Vocabulary for
a discussion on using the document base as part of the vocabulary mapping),
a URN such as urn:example:1, see [URN], or
a "Skolem IRI" as per Replacing Blank Nodes with IRIs of [RDF11-CONCEPTS].
The normative algorithms for interpreting JSON-LD as RDF and serializing RDF as JSON-LD are specified in the JSON-LD 1.1 Processing
Algorithms and API specification [JSON-LD11-API].
Even though JSON-LD serializes RDF Datasets, it can also be used as a graph source. In that case, a consumer MUST only use the default graph and
ignore all named graphs. This allows servers to expose data in languages such as Turtle and JSON-LD using HTTP content negotiation.
Note
Publishers supporting both dataset and graph syntaxes have to ensure that the primary data is stored in the default graph to enable consumers that do
not support datasets to process the information.
This section is non-normative.
The process of serializing RDF as JSON-LD and deserializing JSON-LD to RDF depends on executing the algorithms defined in RDF Serialization-
Deserialization Algorithms in the JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API]. It is beyond the scope of this
document to detail these algorithms any further, but a summary of the necessary operations is provided to illustrate the process.
The procedure to deserialize a JSON-LD document to RDF involves the following steps:
1. Expand the JSON-LD document, removing any context; this ensures that properties, types, and values are given their full representation as IRIs
and expanded values. Expansion is discussed further in § 5.1 Expanded Document Form.
2. Flatten the document, which turns the document into an array of node objects. Flattening is discussed further in § 5.3 Flattened Document
Form.
3. Turn each node object into a series of triples.
For example, consider the following JSON-LD document in compact form:
