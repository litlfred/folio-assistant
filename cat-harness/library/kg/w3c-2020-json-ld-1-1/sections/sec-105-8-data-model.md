---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-105-8-data-model
section_title: "Data Model"
section_number: 8
pages: 73-73
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
To ease understanding for developers unfamiliar with the RDF model, the following summary is provided:
A JSON-LD document serializes a RDF Dataset [RDF11-CONCEPTS], which is a collection of graphs that comprises exactly one default
graph and zero or more named graphs.
The default graph does not have a name and MAY be empty.
Each named graph is a pair consisting of an IRI or blank node identifier (the graph name) and a graph. Whenever practical, the graph name
SHOULD be an IRI.
A graph is a labeled directed graph, i.e., a set of nodes connected by directed-arcs.
Every directed-arc is labeled with an IRI or a blank node identifier. Within the JSON-LD syntax these arc labels are called properties.
Whenever practical, a directed-arc SHOULD be labeled with an IRI.
