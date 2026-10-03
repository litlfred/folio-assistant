---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-023-note
section_title: "Note"
section_number: null
pages: 13-15
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Resolution of relative references to context URLs also applies to remote context documents, as they may themselves contain references to other
contexts.
JSON documents can be interpreted as JSON-LD without having to be modified by referencing a context via an HTTP Link Header as described in
§ 6.1 Interpreting JSON as JSON-LD. It is also possible to apply a custom context using the JSON-LD 1.1 API [JSON-LD11-API].
In JSON-LD documents, contexts may also be specified inline. This has the advantage that documents can be processed even in the absence of a
connection to the Web. Ultimately, this is a modeling decision and different use cases may require different handling. See Security Considerations in
§ C. IANA Considerations for a discussion on using remote contexts.
This section only covers the most basic features of the JSON-LD Context. The Context can also be used to help interpret other more complex JSON
data structures, such as indexed values, ordered values, and nested properties. More advanced features related to the JSON-LD Context are covered in
§ 4. Advanced Concepts.
This section is non-normative.
IRIs (Internationalized Resource Identifiers [RFC3987]) are fundamental to Linked Data as that is how most nodes and properties are identified. In
JSON-LD, IRIs may be represented as an IRI reference. An IRI is defined in [RFC3987] as containing a scheme along with path and optional query
and fragment segments. A relative IRI reference is an IRI that is relative to some other IRI. In JSON-LD, with exceptions that are as described below,
all relative IRI references are resolved relative to the base IRI.
Note
As noted in § 1.1 How to Read this Document, IRIs can often be confused with URLs (Uniform Resource Locators), the primary distinction is that a
URL locates a resource on the web, an IRI identifies a resource. While it is a good practice for resource identifiers to be dereferenceable, sometimes
this is not practical. In particular, note the [URN] scheme for Uniform Resource Names, such as UUID. An example UUID is urn:uuid:f81d4fae-
7dec-11d0-a765-00a0c91e6bf6.
Note
Example 6: Loading a relative context
{
  "@context": "context.jsonld",
  "name": "Manu Sporny",
  "homepage": "http://manu.sporny.org/",
  "image": "http://manu.sporny.org/images/manu.png"
}
Input
Example 7: In-line context definition
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "name": "http://schema.org/name",
    "image": {
      "@id": "http://schema.org/image",
      "@type": "@id"
    },
    "homepage": {
      "@id": "http://schema.org/url",
      "@type": "@id"
    }
  },
  "name": "Manu Sporny",
  "homepage": "http://manu.sporny.org/",
  "image": "http://manu.sporny.org/images/manu.png"
}
3.2 IRIs §
Properties, values of @type, and values of properties with a term definition that defines them as being relative to the vocabulary mapping, may have
the form of a relative IRI reference, but are resolved using the vocabulary mapping, and not the base IRI.
A string is interpreted as an IRI when it is the value of a map entry with the key @id:
Values that are interpreted as IRIs, can also be expressed as relative IRI references. For example, assuming that the following document is located at
http://example.com/about/, the relative IRI reference ../ would expand to http://example.com/ (for more information on where relative IRI
references can be used, please refer to section § 9. JSON-LD Grammar).
IRIs can be expressed directly in the key position like so:
In the example above, the key http://schema.org/name is interpreted as an IRI.
Term-to-IRI expansion occurs if the key matches a term defined within the active context:
JSON keys that do not expand to an IRI, such as status in the example above, are not Linked Data and thus ignored when processed.
If type coercion rules are specified in the @context for a particular term or property IRI, an IRI is generated:
Example 8: Values of @id are interpreted as IRI
{
  ...
  "homepage": { "@id": "http://example.com/" }
  ...
}
Example 9: IRIs can be relative
{
  ...
  "homepage": { "@id": "../" }
  ...
}
Example 10: IRI as a key
{
  ...
  "http://schema.org/name": "Manu Sporny",
  ...
}
Input
Example 11: Term expansion from context definition
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "name": "http://schema.org/name"
  },
  "name": "Manu Sporny",
  "status": "trollin'"
}
Input
Example 12: Type coercion
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    ...
    "homepage": {
      "@id": "http://schema.org/url",
      "@type": "@id"
    }
    ...
  },
  ...
  "homepage": "http://manu.sporny.org/"
  ...
}
In the example above, since the value http://manu.sporny.org/ is expressed as a JSON string, the type coercion rules will transform the value into
an IRI when processing the data. See § 4.2.3 Type Coercion for more details about this feature.
In summary, IRIs can be expressed in a variety of different ways in JSON-LD:
1. Map entries that have a key mapping to a term in the active context expand to an IRI (only applies outside of the context definition).
2. An IRI is generated for the string value specified using @id or @type.
3. An IRI is generated for the string value of any key for which there are coercion rules that contain an @type key that is set to a value of @id or
@vocab.
This section only covers the most basic features associated with IRIs in JSON-LD. More advanced features related to IRIs are covered in section § 4.
Advanced Concepts.
This section is non-normative.
To be able to externally reference nodes in an RDF graph, it is important that nodes have an identifier. IRIs are a fundamental concept of Linked Data,
for nodes to be truly linked, dereferencing the identifier should result in a representation of that node. This may allow an application to retrieve
further information about a node.
In JSON-LD, a node is identified using the @id keyword:
The example above contains a node object identified by the IRI http://me.markus-lanthaler.com/.
This section only covers the most basic features associated with node identifiers in JSON-LD. More advanced features related to node identifiers are
covered in section § 4. Advanced Concepts.
This section is non-normative.
As a syntax, JSON has only a limited number of syntactic elements:
Numbers, which describe literal numeric values,
Strings, which may describe literal string values, or be used as the keys in a JSON object.
Boolean true and false, which describe literal boolean values,
null, which describes the absence of a value,
Arrays, which describe an ordered set of values of any type, and
JSON objects, which provide a set of map entries, relating keys with values.
The JSON-LD data model allows for a richer set of resources, based on the RDF data model. The data model is described more fully in § 8. Data
Model. JSON-LD uses JSON objects to describe various resources, along with the relationships between these resources:
Node objects
Node objects are used to define nodes in the linked data graph which may have both incoming and outgoing edges. Node objects are principle
structure for defining resources having properties. See § 9.2 Node Objects for the normative definition.
Value objects
Value objects are used for describing literal nodes in a linked data graph which may have only incoming edges. In JSON, some literal nodes may be
described without the use of a JSON object (e.g., numbers, strings, and boolean values), but in the expanded form, all literal nodes are described using
value objects. See § 4.2 Describing Values for more information, and § 9.5 Value Objects for the normative definition.
List Objects and Set objects
List Objects are a special kind of JSON-LD maps, distinct from node objects and value objects, used to express ordered values by wrapping an array
in a map under the key @list. Set Objects exist for uniformity, and are equivalent to the array value of the @set key. See § 4.3.1 Lists and § 4.3.2 Sets
for more detail.
Map Objects
JSON-LD uses various forms of maps as ways to more easily access values of a property.
Language Maps
