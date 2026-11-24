---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-117-99-index-maps
section_title: "Index Maps"
section_number: 9.9
pages: 77-78
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
number,
true,
false,
null,
node object,
value object,
list object,
set object,
an array of zero or more of the above possibilities
See § 4.6.1 Data Indexing for further information on this topic.
Index Maps may also be used to map indexes to associated named graphs, if the term is defined with @container set to an array containing both
@graph and @index, and optionally including @set. The value consists of the node objects contained within the named graph which is indexed using
the referencing key, which can be represented as a simple graph object if the value does not include @id, or a named graph if it includes @id.
A property-based index map is a variant of index map were indexes are semantically preserved in the graph as property values. A property-based
index map may be used as a term value within a node object if the term is defined with @container set to @index, or an array containing both @index
and @set, and with @index set to a string. The values of a property-based index map MUST be node objects or strings which expand to node objects.
When expanding, if the active context contains a term definition for the value of @index, this term definition will be used to expand the keys of the
index map. Otherwise, the keys will be expanded as simple value objects. Each node object in the expanded values of the index map will be added an
additional property value, where the property is the expanded value of @index, and the value is the expanded referencing key.
See § 4.6.1.1 Property-based data indexing for further information on this topic.
An id map is used to associate an IRI with a value that allows easy programmatic access. An id map may be used as a term value within a node object
if the term is defined with @container set to @id, or an array containing both @id and @set. The keys of an id map MUST be IRIs (IRI references or
compact IRIs (including blank node identifiers)), the keyword @none, or a term which expands to @none, and the values MUST be node objects.
If the value contains a property expanding to @id, its value MUST be equivalent to the referencing key. Otherwise, the property from the value is used
as the @id of the node object value when expanding.
Id Maps may also be used to map graph names to their named graphs, if the term is defined with @container set to an array containing both @graph
and @id, and optionally including @set. The value consists of the node objects contained within the named graph which is named using the
referencing key.
A type map is used to associate an IRI with a value that allows easy programmatic access. A type map may be used as a term value within a node
object if the term is defined with @container set to @type, or an array containing both @type and @set. The keys of a type map MUST be IRIs (IRI
references or compact IRI (including blank node identifiers)), terms, or the keyword @none, and the values MUST be node objects or strings which
expand to node objects.
If the value contains a property expanding to @type, and its value is contains the referencing key after suitable expansion of both the referencing key
and the value, then the node object already contains the type. Otherwise, the property from the value is added as a @type of the node object value
when expanding.
An included block is used to provide a set of node objects. An included block MAY appear as the value of a member of a node object with either the
key of @included or an alias of @included. An included block is either a node object or an array of node objects.
