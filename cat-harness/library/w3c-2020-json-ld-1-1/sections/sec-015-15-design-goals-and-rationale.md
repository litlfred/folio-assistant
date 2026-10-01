---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-015-15-design-goals-and-rationale
section_title: "Design Goals and Rationale"
section_number: 1.5
pages: 8-9
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Compatibility
A JSON-LD document is always a valid JSON document. This ensures that all of the standard JSON libraries work seamlessly with JSON-LD
documents.
Expressiveness
The syntax serializes labeled directed graphs. This ensures that almost every real world data model can be expressed.
Terseness
The JSON-LD syntax is very terse and human readable, requiring as little effort as possible from the developer.
Zero Edits, most of the time
JSON-LD ensures a smooth and simple transition from existing JSON-based systems. In many cases, zero edits to the JSON document and the
addition of one line to the HTTP response should suffice (see § 6.1 Interpreting JSON as JSON-LD). This allows organizations that have already
deployed large JSON-based infrastructure to use JSON-LD's features in a way that is not disruptive to their day-to-day operations and is transparent
to their current customers. However, there are times where mapping JSON to a graph representation is a complex undertaking. In these instances,
rather than extending JSON-LD to support esoteric use cases, we chose not to support the use case. While Zero Edits is a design goal, it is not always
possible without adding great complexity to the language. JSON-LD focuses on simplicity when possible.
Usable as RDF
JSON-LD is usable by developers as idiomatic JSON, with no need to understand RDF [RDF11-CONCEPTS]. JSON-LD is also usable as RDF, so
people intending to use JSON-LD with RDF tools will find it can be used like any other RDF syntax. Complete details of how JSON-LD relates to
RDF are in section § 10. Relationship to RDF.
This section is non-normative.
Generally speaking, the data model described by a JSON-LD document is a labeled, directed graph. The graph contains nodes, which are connected
by directed-arcs. A node is either a resource with properties, or the data values of those properties including strings, numbers, typed values (like dates
and times) and IRIs.
Within a directed graph, nodes are resources, and may be unnamed, i.e., not identified by an IRI; which are called blank nodes, and may be identified
using a blank node identifier. These identifiers may be required to represent a fully connected graph using a tree structure, such as JSON, but
otherwise have no intrinsic meaning. Literal values, such as strings and numbers, are also considered resources, and JSON-LD distinguishes between
node objects and value objects to distinguish between the different kinds of resource.
This simple data model is incredibly flexible and powerful, capable of modeling almost any kind of data. For a deeper explanation of the data model,
see section § 8. Data Model.
Developers who are familiar with Linked Data technologies will recognize the data model as the RDF Data Model. To dive deeper into how JSON-
LD and RDF are related, see section § 10. Relationship to RDF.
At the surface level, a JSON-LD document is simply JSON, detailed in [RFC8259]. For the purpose of describing the core data structures, this is
limited to arrays, maps (the parsed version of a JSON Object), strings, numbers, booleans, and null, called the JSON-LD internal representation. This
allows surface syntaxes other than JSON to be manipulated using the same algorithms, when the syntax maps to equivalent core data structures.
