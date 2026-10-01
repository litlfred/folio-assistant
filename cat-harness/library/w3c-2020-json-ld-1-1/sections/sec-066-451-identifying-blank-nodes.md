---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-066-451-identifying-blank-nodes
section_title: "Identifying Blank Nodes"
section_number: 4.5.1
pages: 45-46
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
This section is non-normative.
At times, it becomes necessary to be able to express information without being able to uniquely identify the node with an IRI. This type of node is
called a blank node. JSON-LD does not require all nodes to be identified using @id. However, some graph topologies may require identifiers to be
serializable. Graphs containing loops, e.g., cannot be serialized using embedding alone, @id must be used to connect the nodes. In these situations,
one can use blank node identifiers, which look like IRIs using an underscore (_) as scheme. This allows one to reference the node locally within the
document, but makes it impossible to reference the node from an external document. The blank node identifier is scoped to the document in which it
is used.
The example above contains information about two secret agents that cannot be identified with an IRI. While expressing that agent 1 knows agent 2
is possible without using blank node identifiers, it is necessary to assign agent 1 an identifier so that it can be referenced from agent 2.
It is worth noting that blank node identifiers may be relabeled during processing. If a developer finds that they refer to the blank node more than once,
they should consider naming the node using a dereferenceable IRI so that it can also be referenced from other documents.
This section is non-normative.
Sometimes multiple property values need to be accessed in a more direct fashion than iterating though multiple array values. JSON-LD provides an
indexing mechanism to allow the use of an intermediate map to associate specific indexes with associated values.
