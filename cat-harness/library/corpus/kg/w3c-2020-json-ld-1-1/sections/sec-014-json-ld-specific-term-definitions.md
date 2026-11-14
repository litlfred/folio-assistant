---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-014-json-ld-specific-term-definitions
section_title: "JSON-LD Specific Term Definitions"
section_number: null
pages: 7-8
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
A JSON-LD Processor is a system which can perform the algorithms defined in JSON-LD 1.1 Processing Algorithms and API. See the Conformance
section in JSON-LD 1.1 API for a formal description.
JSON-LD value
A JSON-LD value is a string, a number, true or false, a typed value, or a language-tagged string. It represents an RDF literal.
keyword
A string that is specific to JSON-LD, described in the Syntax Tokens and Keywords section of JSON-LD 1.1, and normatively specified in the
Keywords section of JSON-LD 1.1,
language map
An language map is a map value of a term defined with @container set to @language, whose keys must be strings representing [BCP47] language
codes and the values must be any of the following types: null, string, or an array of zero or more of the above possibilities. See the Language Maps
section of JSON-LD 1.1 for a normative description.
list object
A list object is a map that has a @list key. It may also have an @index key, but no other entries. See the Lists and Sets section of JSON-LD 1.1 for a
normative description.
local context
A context that is specified with a map, specified via the @context keyword.
nested property
A nested property is a key in a node object whose value is a map containing entries which are treated as if they were values of the node object. The
nested property itself is semantically meaningless and used only to create a sub-structure within a node object. See the Property Nesting section of
JSON-LD 1.1 for a normative description.
node object
A node object represents zero or more properties of a node in the graph serialized by the JSON-LD document. A map is a node object if it exists
outside of the JSON-LD context and:
it does not contain the @value, @list, or @set keywords, or
it is not the top-most map in the JSON-LD document consisting of no other entries than @graph and @context.
The entries of a node object whose keys are not keywords are also called properties of the node object. See the Node Objects section of JSON-LD 1.1
for a normative description.
node reference
A node object used to reference a node having only the @id key.
prefix
A prefix is the first component of a compact IRI which comes from a term that maps to a string that, when prepended to the suffix of the compact IRI,
results in an IRI.
processing mode
The processing mode defines how a JSON-LD document is processed. By default, all documents are assumed to be conformant with this
specification. By defining a different version using the @version entry in a context, publishers can ensure that processors conformant with JSON-LD
1.0 [JSON-LD10] will not accidentally process JSON-LD 1.1 documents, possibly creating a different output. The API provides an option for setting
the processing mode to json-ld-1.0, which will prevent JSON-LD 1.1 features from being activated, or error if @version entry in a context is
explicitly set to 1.1. This specification extends JSON-LD 1.0 via the json-ld-1.1 processing mode.
scoped context
A scoped context is part of an expanded term definition using the @context entry. It has the same form as an embedded context. When the term is
used as a type, it defines a type-scoped context, when used as a property it defines a property-scoped context.
set object
A set object is a map that has an @set entry. It may also have an @index key, but no other entries. See the Lists and Sets section of JSON-LD 1.1 for a
normative description.
term
A term is a short word defined in a context that may be expanded to an IRI. See the Terms section of JSON-LD 1.1 for a normative description.
term definition
A term definition is an entry in a context, where the key defines a term which may be used within a map as a key, type, or elsewhere that a string is
interpreted as a vocabulary item. Its value is either a string (simple term definition), expanding to an IRI, or a map (expanded term definition).
type map
A type map is a map value of a term defined with @container set to @type, whose keys are interpreted as IRIs representing the @type of the
associated node object; the value must be a node object, or array of node objects. If the value contains a term expanding to @type, its values are
merged with the map value when expanding. See the Type Maps section of JSON-LD 1.1 for a normative description.
typed value
A typed value consists of a value, which is a string, and a type, which is an IRI.
value object
A value object is a map that has an @value entry. See the Value Objects section of JSON-LD 1.1 for a normative description.
vocabulary mapping
The vocabulary mapping is set in the context using the @vocab key whose value must be an IRI, a compact IRI, a term, or null. See the Context
Definitions section of JSON-LD 1.1 for a normative description.
This section is non-normative.
JSON-LD satisfies the following design goals:
Simplicity
No extra processors or software libraries are necessary to use JSON-LD in its most basic form. The language provides developers with a very easy
learning curve. Developers not concerned with Linked Data only need to understand JSON, and know to include but ignore the @context property, to
use the basic functionality in JSON-LD.
