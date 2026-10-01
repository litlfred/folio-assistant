---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-025-34-uses-of-json-objects
section_title: "Uses of JSON Objects"
section_number: 3.4
pages: 15-16
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Allows multiple values differing in their associated language to be indexed by language tag. See § 4.6.2 Language Indexing for more information,
and § 9.8 Language Maps for the normative definition.
Index Maps
Allows multiple values (node objects or value objects) to be indexed by an associated @index. See § 4.6.1 Data Indexing for more information, and
§ 9.9 Index Maps for the normative definition.
Id Maps
Allows multiple node objects to be indexed by an associated @id. See § 4.6.3 Node Identifier Indexing for more information, and § 9.11 Id Maps for
the normative definition.
Type Maps
Allows multiple node objects to be indexed by an associated @type. See § 4.6.4 Node Type Indexing for more information, and § 9.12 Type Maps for
the normative definition.
Named Graph Indexing
Allows multiple named graphs to be indexed by an associated graph name. See § 4.9.3 Named Graph Indexing for more information.
Graph objects
A graph object is much like a node object, except that it defines a named graph. See § 4.9 Named Graphs for more information, and § 9.4 Graph
Objects for the normative definition. A node object may also describe a named graph, in addition to other properties defined on the node. The notable
difference is that a graph object only describes a named graph.
Context Definitions
A Context Definition uses the JSON object form, but is not itself data in a linked data graph. A Context Definition also may contain expanded term
definitions, which are also represented using JSON objects. See § 3.1 The Context, § 4.1 Advanced Context Usage for more information, and § 9.15
Context Definitions for the normative definition.
This section is non-normative.
In Linked Data, it is common to specify the type of a graph node; in many cases, this can be inferred based on the properties used within a given node
object, or the property for which a node is a value. For example, in the schema.org vocabulary, the givenName property is associated with a Person.
Therefore, one may reason that if a node object contains the property givenName, that the type is a Person; making this explicit with @type helps to
clarify the association.
The type of a particular node can be specified using the @type keyword. In Linked Data, types are uniquely identified with an IRI.
A node can be assigned more than one type by using an array:
The value of a @type key may also be a term defined in the active context:
