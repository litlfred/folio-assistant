---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-050-note
section_title: "Note"
section_number: null
pages: 34-34
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The @type keyword is also used to associate a type with a node. The concept of a node type and a value type are distinct. For more on adding types to
nodes, see § 3.5 Specifying the Type.
Note
When expanding, an @type defined within a term definition can be associated with a string value to create an expanded value object, which is
described in § 4.2.3 Type Coercion. Type coercion only takes place on string values, not for values which are maps, such as node objects and value
objects in their expanded form.
A node type specifies the type of thing that is being described, like a person, place, event, or web page. A value type specifies the data type of a
particular value, such as an integer, a floating point number, or a date.
The first use of @type associates a node type (http://schema.org/BlogPosting) with the node, which is expressed using the @id keyword. The
second use of @type associates a value type (http://www.w3.org/2001/XMLSchema#dateTime) with the value expressed using the @value keyword.
As a general rule, when @value and @type are used in the same map, the @type keyword is expressing a value type. Otherwise, the @type keyword is
expressing a node type. The example above expresses the following data:
This section is non-normative.
At times, it is useful to include JSON within JSON-LD that is not interpreted as JSON-LD. Generally, a JSON-LD processor will ignore properties
which don't map to IRIs, but this causes them to be excluded when performing various algorithmic transformations. But, when the data that is being
described is, itself, JSON, it's important that it survives algorithmic transformations.
