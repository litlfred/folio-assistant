---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-018-17-syntax-tokens-and-keywords
section_title: "Syntax Tokens and Keywords"
section_number: 1.7
pages: 9-10
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Used to define the short-hand names that are used throughout a JSON-LD document. These short-hand names are called terms and help developers to
express specific identifiers in a compact manner. The @context keyword is described in detail in § 3.1 The Context.
@direction
Used to set the base direction of a JSON-LD value, which are not typed values (e.g. strings, or language-tagged strings). This keyword is described in
§ 4.2.4 String Internationalization.
@graph
Used to express a graph. This keyword is described in § 4.9 Named Graphs.
@id
Used to uniquely identify node objects that are being described in the document with IRIs or blank node identifiers. This keyword is described in
§ 3.3 Node Identifiers. A node reference is a node object containing only the @id property, which may represent a reference to a node object found
elsewhere in the document.
@import
Used in a context definition to load an external context within which the containing context definition is merged. This can be useful to add JSON-LD
1.1 features to JSON-LD 1.0 contexts.
@included
Used in a top-level node object to define an included block, for including secondary node objects within another node object.
@index
Used to specify that a container is used to index information and that processing should continue deeper into a JSON data structure. This keyword is
described in § 4.6.1 Data Indexing.
@json
Used as the @type value of a JSON literal. This keyword is described in § 4.2.2 JSON Literals.
@language
Used to specify the language for a particular string value or the default language of a JSON-LD document. This keyword is described in § 4.2.4
String Internationalization.
@list
Used to express an ordered set of data. This keyword is described in § 4.3.1 Lists.
@nest
Used to define a property of a node object that groups together properties of that node, but is not an edge in the graph.
@none
Used as an index value in an index map, id map, language map, type map, or elsewhere where a map is used to index into other values, when the
indexed node does not have the feature being indexed.
@prefix
With the value true, allows this term to be used to construct a compact IRI when compacting. With the value false prevents the term from being
used to construct a compact IRI. Also determines if the term will be considered when expanding compact IRIs.
@propagate
Used in a context definition to change the scope of that context. By default, it is true, meaning that contexts propagate across node objects (other
than for type-scoped contexts, which default to false). Setting this to false causes term definitions created within that context to be removed when
entering a new node object.
@protected
Used to prevent term definitions of a context to be overridden by other contexts. This keyword is described in § 4.1.11 Protected Term Definitions.
@reverse
Used to express reverse properties. This keyword is described in § 4.8 Reverse Properties.
@set
Used to express an unordered set of data and to ensure that values are always represented as arrays. This keyword is described in § 4.3.2 Sets.
@type
Used to set the type of a node or the datatype of a typed value. This keyword is described further in § 3.5 Specifying the Type and § 4.2.1 Typed
Values.
Note
The use of @type to define a type for both node objects and value objects addresses the basic need to type data, be it a literal value or a more
complicated resource. Experts may find the overloaded use of the @type keyword for both purposes concerning, but should note that Web developer
usage of this feature over multiple years has not resulted in its misuse due to the far less frequent use of @type to express typed literal values.
@value
Used to specify the data that is associated with a particular property in the graph. This keyword is described in § 4.2.4 String Internationalization and
§ 4.2.1 Typed Values.
@version
Used in a context definition to set the processing mode. New features since JSON-LD 1.0 [JSON-LD10] described in this specification are not
available when processing mode has been explicitly set to json-ld-1.0.
Note
Within a context definition @version takes the specific value 1.1, not "json-ld-1.1", as a JSON-LD 1.0 processor may accept a string value for
@version, but will reject a numeric value.
Note
The use of 1.1 for the value of @version is intended to cause a JSON-LD 1.0 processor to stop processing. Although it is clearly meant to be related
to JSON-LD 1.1, it does not otherwise adhere to the requirements for Semantic Versioning.
@vocab
Used to expand properties and values in @type with a common prefix IRI. This keyword is described in § 4.1.2 Default Vocabulary.
All keys, keywords, and values in JSON-LD are case-sensitive.
