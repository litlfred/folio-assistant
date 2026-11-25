---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-108-91-terms
section_title: "Terms"
section_number: 9.1
pages: 75-75
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
A node object represents zero or more properties of a node in the graph serialized by the JSON-LD document. A map is a node object if it exists
outside of a JSON-LD context and:
it is not the top-most map in the JSON-LD document consisting of no other entries than @graph and @context,
it does not contain the @value, @list, or @set keywords, and
it is not a graph object.
The properties of a node in a graph may be spread among different node objects within a document. When that happens, the keys of the different node
objects need to be merged to create the properties of the resulting node.
A node object MUST be a map. All keys which are not IRIs, compact IRIs, terms valid in the active context, or one of the following keywords (or
alias of such a keyword) MUST be ignored when processed:
@context,
@id,
@included,
@graph,
@nest,
@type,
@reverse, or
@index
If the node object contains the @context key, its value MUST be null, an IRI reference, a context definition, or an array composed of any of these.
If the node object contains the @id key, its value MUST be an IRI reference, or a compact IRI (including blank node identifiers). See § 3.3 Node
Identifiers, § 4.1.5 Compact IRIs, and § 4.5.1 Identifying Blank Nodes for further discussion on @id values.
If the node object contains the @graph key, its value MUST be a node object or an array of zero or more node objects. If the node object also contains
an @id keyword, its value is used as the graph name of a named graph. See § 4.9 Named Graphs for further discussion on @graph values. As a special
case, if a map contains no keys other than @graph and @context, and the map is the root of the JSON-LD document, the map is not treated as a node
object; this is used as a way of defining node objects that may not form a connected graph. This allows a context to be defined which is shared by all
