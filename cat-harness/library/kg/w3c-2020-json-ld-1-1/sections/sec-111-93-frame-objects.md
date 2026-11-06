---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-111-93-frame-objects
section_title: "Frame Objects"
section_number: 9.3
pages: 76-76
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
A graph object represents a named graph, which MAY include an explicit graph name. A map is a graph object if it exists outside of a JSON-LD
context, it contains an @graph entry (or an alias of that keyword), it is not the top-most map in the JSON-LD document, and it consists of no entries
other than @graph, @index, @id and @context, or an alias of one of these keywords.
If the graph object contains the @context key, its value MUST be null, an IRI reference, a context definition, or an array composed of any of these.
If the graph object contains the @id key, its value is used as the identifier (graph name) of a named graph, and MUST be an IRI reference, or a
compact IRI (including blank node identifiers). See § 3.3 Node Identifiers, § 4.1.5 Compact IRIs, and § 4.5.1 Identifying Blank Nodes for further
discussion on @id values.
A graph object without an @id entry is also a simple graph object and represents a named graph without an explicit identifier, although in the data
model it still has a graph name, which is an implicitly allocated blank node identifier.
The value of the @graph key MUST be a node object or an array of zero or more node objects. See § 4.9 Named Graphs for further discussion on
@graph values..
A value object is used to explicitly associate a type or a language with a value to create a typed value or a language-tagged string and possibly
associate a base direction.
9.3 Frame Objects §
