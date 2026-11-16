---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-124-9151-expanded-term-definition
section_title: "Expanded term definition"
section_number: 9.15.1
pages: 79-82
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
When the associated term is @type, the expanded term definition MUST NOT contain keys other than @container and @protected. The value of
@container is limited to the single value @set.
If the term being defined is not an IRI or a compact IRI and the active context does not have an @vocab mapping, the expanded term definition MUST
include the @id key.
Term definitions with keys which are of the form of an IRI or a compact IRI MUST NOT expand to an IRI other than the expansion of the key itself.
If the expanded term definition contains the @id keyword, its value MUST be null, an IRI, a blank node identifier, a compact IRI, a term, or a
keyword.
If an expanded term definition has an @reverse entry, it MUST NOT have @id or @nest entries at the same time, its value MUST be an IRI, a blank
node identifier, a compact IRI, or a term. If an @container entry exists, its value MUST be null, @set, or @index.
If the expanded term definition contains the @type keyword, its value MUST be an IRI, a compact IRI, a term, null, or one of the keywords @id,
@json, @none, or @vocab.
If the expanded term definition contains the @language keyword, its value MUST have the lexical form described in [BCP47] or be null.
If the expanded term definition contains the @index keyword, its value MUST be an IRI, a compact IRI, or a term.
If the expanded term definition contains the @container keyword, its value MUST be either @list, @set, @language, @index, @id, @graph, @type, or
be null or an array containing exactly any one of those keywords, or a combination of @set and any of @index, @id, @graph, @type, @language in any
order . @container may also be an array containing @graph along with either @id or @index and also optionally including @set. If the value is
@language, when the term is used outside of the @context, the associated value MUST be a language map. If the value is @index, when the term is
used outside of the @context, the associated value MUST be an index map.
If an expanded term definition has an @context entry, it MUST be a valid context definition.
If the expanded term definition contains the @nest keyword, its value MUST be either @nest, or a term which expands to @nest.
If the expanded term definition contains the @prefix keyword, its value MUST be true or false.
If the expanded term definition contains the @propagate keyword, its value MUST be true or false.
If the expanded term definition contains the @protected keyword, its value MUST be true or false.
Terms MUST NOT be used in a circular manner. That is, the definition of a term cannot depend on the definition of another term if that other term
also depends on the first term.
See § 3.1 The Context for further discussion on contexts.
9.15.1 Expanded term definition §
JSON-LD keywords are described in § 1.7 Syntax Tokens and Keywords, this section describes where each keyword may appear within different
JSON-LD structures.
Within node objects, value objects, graph objects, list objects, set objects, and nested properties keyword aliases MAY be used instead of the
corresponding keyword, except for @context. The @context keyword MUST NOT be aliased. Within local contexts and expanded term definitions,
keyword aliases MAY NOT used.
@base
The unaliased @base keyword MAY be used as a key in a context definition. Its value MUST be an IRI reference, or null.
@container
The unaliased @container keyword MAY be used as a key in an expanded term definition. Its value MUST be either @list, @set, @language,
@index, @id, @graph, @type, or be null, or an array containing exactly any one of those keywords, or a combination of @set and any of @index, @id,
@graph, @type, @language in any order. The value may also be an array containing @graph along with either @id or @index and also optionally
including @set.
@context
The @context keyword MUST NOT be aliased, and MAY be used as a key in the following objects:
node objects (see § 9.2 Node Objects),
value objects (see § 9.5 Value Objects),
graph objects (see § 9.4 Graph Objects),
list objects (see § 9.7 Lists and Sets),
set objects (see § 9.7 Lists and Sets),
nested properties (see § 9.14 Property Nesting), and
expanded term definitions (see § 9.15 Context Definitions).
The value of @context MUST be null, an IRI reference, a context definition, or an array composed of any of these.
@direction
The @direction keyword MAY be aliased and MAY be used as a key in a value object. Its value MUST be one of "ltr" or "rtl", or be null.
The unaliased @direction MAY be used as a key in a context definition.
See § 4.2.4.1 Base Direction for a further discussion.
@graph
The @graph keyword MAY be aliased and MAY be used as a key in a node object or a graph object, where its value MUST be a value object, node
object, or an array of either value objects or node objects.
The unaliased @graph MAY be used as the value of the @container key within an expanded term definition.
See § 4.9 Named Graphs.
@id
The @id keyword MAY be aliased and MAY be used as a key in a node object or a graph object.
The unaliased @id MAY be used as a key in an expanded term definition, or as the value of the @container key within an expanded term definition.
The value of the @id key MUST be an IRI reference, or a compact IRI (including blank node identifiers).
See § 3.3 Node Identifiers, § 4.1.5 Compact IRIs, and § 4.5.1 Identifying Blank Nodes for further discussion on @id values.
@import
The unaliased @import keyword MAY be used in a context definition. Its value MUST be an IRI reference. See § 4.1.10 Imported Contexts for a
further discussion.
@included
The @included keyword MAY be aliased and its value MUST be an included block. This keyword is described further in § 4.7 Included Nodes, and
§ 9.13 Included Blocks.
@index
The @index keyword MAY be aliased and MAY be used as a key in a node object, value object, graph object, set object, or list object. Its value MUST
be a string.
The unaliased @index MAY be used as the value of the @container key within an expanded term definition and as an entry in a expanded term
definition, where the value an IRI, a compact IRI, or a term.
See § 9.9 Index Maps, and § 4.6.1.1 Property-based data indexing for a further discussion.
@json
The @json keyword MAY be aliased and MAY be used as the value of the @type key within a value object or an expanded term definition.
See § 4.2.2 JSON Literals.
@language
The @language keyword MAY be aliased and MAY be used as a key in a value object. Its value MUST be a string with the lexical form described in
[BCP47] or be null.
9.16 Keywords §
The unaliased @language MAY be used as a key in a context definition, or as the value of the @container key within an expanded term definition.
See § 4.2.4 String Internationalization, § 9.8 Language Maps.
@list
The @list keyword MAY be aliased and MUST be used as a key in a list object. The unaliased @list MAY be used as the value of the @container
key within an expanded term definition. Its value MUST be one of the following:
string,
number,
true,
false,
null,
node object,
value object, or
an array of zero or more of the above possibilities
See § 4.3 Value Ordering for further discussion on sets and lists.
@nest
The @nest keyword MAY be aliased and MAY be used as a key in a node object, where its value must be a map.
The unaliased @nest MAY be used as the value of a simple term definition, or as a key in an expanded term definition, where its value MUST be a
string expanding to @nest.
See § 9.14 Property Nesting for a further discussion.
@none
The @none keyword MAY be aliased and MAY be used as a key in an index map, id map, language map, type map. See § 4.6.1 Data Indexing, § 4.6.2
Language Indexing, § 4.6.3 Node Identifier Indexing, § 4.6.4 Node Type Indexing, § 4.9.3 Named Graph Indexing, or § 4.9.2 Named Graph Data
Indexing for a further discussion.
@prefix
The unaliased @prefix keyword MAY be used as a key in an expanded term definition. Its value MUST be true or false. See § 4.1.5 Compact IRIs
and § 9.15 Context Definitions for a further discussion.
@propagate
The unaliased @propagate keyword MAY be used in a context definition. Its value MUST be true or false. See § 4.1.9 Context Propagation for a
further discussion.
@protected
The unaliased @protected keyword MAY be used in a context definition, or an expanded term definition. Its value MUST be true or false. See
§ 4.1.11 Protected Term Definitions for a further discussion.
@reverse
The @reverse keyword MAY be aliased and MAY be used as a key in a node object.
The unaliased @reverse MAY be used as a key in an expanded term definition.
The value of the @reverse key MUST be an IRI reference, or a compact IRI (including blank node identifiers).
See § 4.8 Reverse Properties and § 9.15 Context Definitions for further discussion.
@set
The @set keyword MAY be aliased and MUST be used as a key in a set object. Its value MUST be one of the following:
string,
number,
true,
false,
null,
node object,
value object, or
an array of zero or more of the above possibilities
The unaliased @set MAY be used as the value of the @container key within an expanded term definition.
See § 4.3 Value Ordering for further discussion on sets and lists.
@type
The @type keyword MAY be aliased and MAY be used as a key in a node object or a value object, where its value MUST be a term, IRI reference, or a
compact IRI (including blank node identifiers).
The unaliased @type MAY be used as a key in an expanded term definition, where its value may also be either @id or @vocab, or as the value of the
@container key within an expanded term definition.
Within a context, @type may be used as the key for an expanded term definition, whose entries are limited to @container and @protected.
This keyword is described further in § 3.5 Specifying the Type and § 4.2.1 Typed Values.
@value
The @value keyword MAY be aliased and MUST be used as a key in a value object. Its value key MUST be either a string, a number, true, false or
null. This keyword is described further in § 9.5 Value Objects.
@version
The unaliased @version keyword MAY be used as a key in a context definition. Its value MUST be a number with the value 1.1. This keyword is
described further in § 9.15 Context Definitions.
@vocab
The unaliased @vocab keyword MAY be used as a key in a context definition or as the value of @type in an expanded term definition. Its value MUST
be an IRI reference, a compact IRI, a blank node identifier, a term, or null. This keyword is described further in § 9.15 Context Definitions, and
§ 4.1.2 Default Vocabulary.
JSON-LD is a concrete RDF syntax as described in [RDF11-CONCEPTS]. Hence, a JSON-LD document is both an RDF document and a JSON
document and correspondingly represents an instance of an RDF data model. However, JSON-LD also extends the RDF data model to optionally
allow JSON-LD to serialize generalized RDF Datasets. The JSON-LD extensions to the RDF data model are:
In JSON-LD properties can be IRIs or blank nodes whereas in RDF properties (predicates) have to be IRIs. This means that JSON-LD
serializes generalized RDF Datasets.
In JSON-LD lists use native JSON syntax, either contained in a list object, or described as such within a context. Consequently, developers
using the JSON representation can access list elements directly rather than using the vocabulary for collections described in [RDF-SCHEMA].
RDF values are either typed literals (typed values) or language-tagged strings whereas JSON-LD also supports JSON's native data types, i.e.,
number, strings, and the boolean values true and false. The JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API]
defines the conversion rules between JSON's native data types and RDF's counterparts to allow round-tripping.
As an extension to the RDF data model, literals without an explicit datatype MAY include a base direction. As there is currently no standardized
mechanism for representing the base direction of RDF literals, the JSON-LD to standard RDF transformation loses the base direction.
However, the Deserialize JSON-LD to RDF Algorithm provides a means of representing base direction using mechanisms which will preserve
round-tripping through non-standard RDF.
