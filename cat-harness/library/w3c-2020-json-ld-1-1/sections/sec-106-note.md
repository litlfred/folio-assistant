---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-106-note
section_title: "Note"
section_number: null
pages: 73-74
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The use of blank node identifiers to label properties is obsolete, and may be removed in a future version of JSON-LD. Consider using a
document-relative IRI, instead, such as #.
Every node is an IRI, a blank node, or a literal, although syntactically lists and native JSON values may be represented directly.
A node having an outgoing edge MUST be an IRI or a blank node.
A graph MUST NOT contain unconnected nodes, i.e., nodes which are not connected by an property to any other node.
Note
This effectively just prohibits unnested, empty node objects and unnested node objects that contain only an @id. A document may have nodes
which are unrelated, as long as one or more properties are defined, or the node is referenced from another node object.
An IRI (Internationalized Resource Identifier) is a string that conforms to the syntax defined in [RFC3987]. IRIs used within a graph SHOULD
return a Linked Data document describing the resource denoted by that IRI when being dereferenced.
A blank node is a node which is neither an IRI, nor a JSON-LD value, nor a list. A blank node is identified using a blank node identifier.
A blank node identifier is a string that can be used as an identifier for a blank node within the scope of a JSON-LD document. Blank node
identifiers begin with _:.
A JSON-LD value is a typed value, a string (which is interpreted as a typed value with type xsd:string), a number (numbers with a non-zero
fractional part, i.e., the result of a modulo‑1 operation, or which are too large to represent as integers (see Data Round Tripping) in [JSON-
LD11-API]), are interpreted as typed values with type xsd:double, all other numbers are interpreted as typed values with type xsd:integer),
true or false (which are interpreted as typed values with type xsd:boolean), or a language-tagged string.
A typed value consists of a value, which is a string, and a type, which is an IRI.
A language-tagged string consists of a string and a non-empty language tag as defined by [BCP47]. The language tag MUST be well-formed
according to section 2.2.9 Classes of Conformance of [BCP47]. Processors MAY normalize language tags to lowercase.
Either strings, or language-tagged strings may include a base direction, which represents an extension to the underlying RDF data model.
A list is a sequence of zero or more IRIs, blank nodes, and JSON-LD values. Lists are interpreted as RDF list structures [RDF11-MT].
JSON-LD documents MAY contain data that cannot be represented by the data model defined above. Unless otherwise specified, such data is ignored
when a JSON-LD document is being processed. One result of this rule is that properties which are not mapped to an IRI, a blank node, or keyword
will be ignored.
Additionally, the JSON serialization format is internally represented using the JSON-LD internal representation, which uses the generic concepts of
lists, maps, strings, numbers, booleans, and null to describe the data represented by a JSON document.
}
</script>
8. Data Model §
Example 149: Illegal Unconnected Node
{
  "@id": "http://example.org/1"
}
Figure 1 An illustration of a linked data dataset.
A description of the linked data dataset diagram is available in the Appendix. Image available in SVG and PNG formats.
The dataset described in this figure can be represented as follows:
