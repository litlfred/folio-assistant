---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-053-note
section_title: "Note"
section_number: null
pages: 35-35
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Generally, when a JSON-LD processor encounters null, the associated entry or value is removed. However, null is a valid JSON token; when used
as the value of a JSON literal, a null value will be preserved.
This section is non-normative.
JSON-LD supports the coercion of string values to particular data types. Type coercion allows someone deploying JSON-LD to use string property
values and have those values be interpreted as typed values by associating an IRI with the value in the expanded value object representation. Using
type coercion, string value representation can be used without requiring the data type to be specified explicitly with each piece of data.
Type coercion is specified within an expanded term definition using the @type key. The value of this key expands to an IRI. Alternatively, the
keyword @id or @vocab may be used as value to indicate that within the body of a JSON-LD document, a string value of a term coerced to @id or
@vocab is to be interpreted as an IRI. The difference between @id and @vocab is how values are expanded to IRIs. @vocab first tries to expand the
value by interpreting it as term. If no matching term is found in the active context, it tries to expand it as an IRI or a compact IRI if there's a colon in
the value; otherwise, it will expand the value using the active context's vocabulary mapping, if present. Values coerced to @id in contrast are
expanded as an IRI or a compact IRI if a colon is present; otherwise, they are interpreted as relative IRI references.
Note
The ability to coerce a value using a term definition is distinct from setting one or more types on a node object, as the former does not result in new
data being added to the graph, while the latter manages node types through adding additional relationships to the graph.
Terms or compact IRIs used as the value of a @type key may be defined within the same context. This means that one may specify a term like xsd
and then use xsd:integer within the same context definition.
The example below demonstrates how a JSON-LD author can coerce values to typed values and IRIs.
It is important to note that terms are only used in expansion for vocabulary-relative positions, such as for keys and values of map entries. Values of
@id are considered to be document-relative, and do not use term definitions for expansion. For example, consider the following:
Input
{
  "@context": {
    "@version": 1.1,
    "e": {"@id": "http://example.com/vocab/json", "@type": "@json"}
  },
  "e": [
    56.0,
    {
      "d": true,
      "10": null,
      "1": [ ]
    }
  ]
}
