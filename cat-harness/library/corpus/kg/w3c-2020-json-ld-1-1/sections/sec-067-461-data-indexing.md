---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-067-461-data-indexing
section_title: "Data Indexing"
section_number: 4.6.1
pages: 46-46
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
As described in § 4.6.1 Data Indexing, data indexing allows an arbitrary key to reference a node or value.
Language Indexing
As described in § 4.6.2 Language Indexing, language indexing allows a language to reference a string and be interpreted as the language associated
with that string.
Node Identifier Indexing
As described in § 4.6.3 Node Identifier Indexing, node identifier indexing allows an IRI to reference a node and be interpreted as the identifier of that
node.
Node Type Indexing
As described in § 4.6.4 Node Type Indexing, node type indexing allows an IRI to reference a node and be interpreted as a type of that node.
See § 4.9 Named Graphs for other uses of indexing in JSON-LD.
This section is non-normative.
Databases are typically used to make access to data more efficient. Developers often extend this sort of functionality into their application data to
deliver similar performance gains. This data may have no meaning from a Linked Data standpoint, but is still useful for an application.
JSON-LD introduces the notion of index maps that can be used to structure data into a form that is more efficient to access. The data indexing feature
allows an author to structure data using a simple key-value map where the keys do not map to IRIs. This enables direct access to data instead of
having to scan an array in search of a specific item. In JSON-LD such data can be specified by associating the @index keyword with a @container
declaration in the context:
Input
Example 96: Specifying a local blank node identifier
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": "http://schema.org/",
   ...
   "@id": "_:n1",
   "name": "Secret Agent 1",
   "knows": {
     "name": "Secret Agent 2",
     "knows": { "@id": "_:n1" }
   }
}
