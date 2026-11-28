---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-013-terms-imported-from-other-specifications
section_title: "Terms imported from Other Specifications"
section_number: null
pages: 5-7
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
In the internal representation a JSON object is described as a map (see [INFRA]), composed of entries with key/value pairs.
In the Application Programming Interface, a map is described using a [WEBIDL] record.
null
The use of the null value within JSON-LD is used to ignore or reset values. A map entry in the @context where the value, or the @id of the value, is
null, explicitly decouples a term's association with an IRI. A map entry in the body of a JSON-LD document whose value is null has the same
meaning as if the map entry was not defined. If @value, @list, or @set is set to null in expanded form, then the entire JSON object is ignored.
number
In the JSON serialization, a number is similar to that used in most programming languages, except that the octal and hexadecimal formats are not
used and that leading zeros are not allowed. In the internal representation, a number is equivalent to either a long or double, depending on if the
number has a non-zero fractional part (see [WEBIDL]).
scalar
A scalar is either a string, number, true, or false.
string
A string is a sequence of zero or more Unicode (UTF-8) characters, wrapped in double quotes, using backslash escapes (if necessary). A character is
represented as a single character string.
Terms imported from Internationalized Resource Identifiers (IRIs) [RFC3987]
IRI
The absolute form of an IRI containing a scheme along with a path and optional query and fragment segments.
IRI reference
Denotes the common usage of an Internationalized Resource Identifier. An IRI reference may be absolute or relative. However, the "IRI" that results
from such a reference only includes absolute IRIs; any relative IRI references are resolved to their absolute form.
relative IRI reference
A relative IRI reference is an IRI reference that is relative to some other IRI, typically the base IRI of the document. Note that properties, values of
@type, and values of terms defined to be vocabulary relative are resolved relative to the vocabulary mapping, not the base IRI.
Terms imported from RDF 1.1 Concepts and Abstract Syntax [RDF11-CONCEPTS], RDF Schema 1.1 [RDF-SCHEMA], and Linked Data Design
Issues [LINKED-DATA]
base IRI
The base IRI is an IRI established in the context, or is based on the JSON-LD document location. The base IRI is used to turn relative IRI references
into IRIs.
blank node
A node in a graph that is neither an IRI, nor a literal. A blank node does not contain a de-referenceable identifier because it is either ephemeral in
nature or does not contain information that needs to be linked to from outside of the linked data graph. In JSON-LD, a blank node is assigned an
identifier starting with the prefix _:.
blank node identifier
A blank node identifier is a string that can be used as an identifier for a blank node within the scope of a JSON-LD document. Blank node identifiers
begin with _:.
dataset
A dataset representing a collection of RDF graphs including exactly one default graph and zero or more named graphs.
datatype IRI
A datatype IRI is an IRI identifying a datatype that determines how the lexical form maps to a literal value.
default graph
The default graph of a dataset is an RDF graph having no name, which may be empty.
graph name
The IRI or blank node identifying a named graph.
language-tagged string
A language-tagged string consists of a string and a non-empty language tag as defined by [BCP47]. The language tag must be well-formed according
to section 2.2.9 Classes of Conformance of [BCP47]. Processors may normalize language tags to lowercase.
Linked Data
A set of documents, each containing a representation of a linked data graph or dataset.
list
A list is an ordered sequence of IRIs, blank nodes, and literals.
literal
An object expressed as a value such as a string or number. Implicitly or explicitly includes a datatype IRI and, if the datatype is rdf:langString, an
optional language tag.
named graph
A named graph is a linked data graph that is identified by an IRI or blank node.
node
A node in an RDF graph, either the subject and object of at least one triple. Note that a node can play both roles (subject and object) in a graph, even
in the same triple.
object
An object is a node in a linked data graph with at least one incoming edge.
property
The name of a directed-arc in a linked data graph. Every property is directional and is labeled with an IRI or a blank node identifier. Whenever
possible, a property should be labeled with an IRI.
Note
The use of blank node identifiers to label properties is obsolete, and may be removed in a future version of JSON-LD.
Also, see predicate in [RDF11-CONCEPTS].
RDF graph
A labeled directed graph, i.e., a set of nodes connected by directed-arcs. Also called linked data graph.
resource
A resource denoted by an IRI, a blank node or literal representing something in the world (the "universe of discourse").
subject
A subject is a node in a linked data graph with at least one outgoing edge, related to an object node through a property.
triple
A component of an RDF graph including a subject, predicate, and object, which represents a node-arc-node segment of an RDF graph.
active context
A context that is used to resolve terms while the processing algorithm is running.
base direction
The base direction is the direction used when a string does not have a direction associated with it directly. It can be set in the context using the
@direction key whose value must be one of the strings "ltr", "rtl", or null. See the Context Definitions section of JSON-LD 1.1 for a normative
description.
compact IRI
A compact IRI has the form of prefix:suffix and is used as a way of expressing an IRI without needing to define separate term definitions for each IRI
contained within a common vocabulary identified by prefix.
context
A set of rules for interpreting a JSON-LD document as described in the The Context section of JSON-LD 1.1, and normatively specified in the
Context Definitions section of JSON-LD 1.1.
default language
The default language is the language used when a string does not have a language associated with it directly. It can be set in the context using the
@language key whose value must be a string representing a [BCP47] language code or null. See the Context Definitions section of JSON-LD 1.1 for
a normative description.
default object
A default object is a map that has a @default key.
embedded context
An embedded context is a context which appears as the @context entry of one of the following: a node object, a value object, a graph object, a list
object, a set object, the value of a nested properties, or the value of an expanded term definition. Its value may be a map for a context definition, as an
IRI, or as an array combining either of the above.
expanded term definition
An expanded term definition is a term definition where the value is a map containing one or more keyword keys to define the associated IRI, if this is
a reverse property, the type associated with string values, and a container mapping. See the Expanded Term Definition section of JSON-LD 1.1 for a
normative description.
frame
A JSON-LD document, which describes the form for transforming another JSON-LD document using matching and embedding rules. A frame
document allows additional keywords and certain map entries to describe the matching and transforming process.
frame object
A frame object is a map element within a frame which represents a specific portion of the frame matching either a node object or a value object in the
input. See the Frame Objects section of JSON-LD 1.1 for a normative description.
graph object
A graph object represents a named graph as the value of a map entry within a node object. When expanded, a graph object must have an @graph entry,
and may also have @id, and @index entries. A simple graph object is a graph object which does not have an @id entry. Note that node objects may
have a @graph entry, but are not considered graph objects if they include any other entries. A top-level object consisting of @graph is also not a graph
object. Note that a node object may also represent a named graph it it includes other properties. See the Graph Objects section of JSON-LD 1.1 for a
normative description.
id map
An id map is a map value of a term defined with @container set to @id. The values of the id map must be node objects, and its keys are interpreted as
IRIs representing the @id of the associated node object. If a value in the id map contains a key expanding to @id, its value must be equivalent to the
referencing key in the id map. See the Id Maps section of JSON-LD 1.1 for a normative description.
implicitly named graph
A named graph created from the value of a map entry having an expanded term definition where @container is set to @graph.
included block
An included block is an entry in a node object where the key is either @included or an alias of @included and the value is one or more node objects.
See the Included Blocks section of JSON-LD 1.1 for a normative description.
index map
An index map is a map value of a term defined with @container set to @index, whose values must be any of the following types: string, number,
true, false, null, node object, value object, list object, set object, or an array of zero or more of the above possibilities. See the Index Maps section
in JSON-LD 1.1 for a formal description.
JSON literal
A JSON literal is a literal where the associated datatype IRI is rdf:JSON. In the value object representation, the value of @type is @json. JSON
literals represent values which are valid JSON [RFC8259]. See the The rdf:JSON Datatype section in JSON-LD 1.1 for a normative description.
JSON-LD document
A JSON-LD document is a serialization of an RDF dataset. See the JSON-LD Grammar section in JSON-LD 1.1 for a formal description.
JSON-LD internal representation
The JSON-LD internal representation is the result of transforming a JSON syntactic structure into the core data structures suitable for direct
processing: arrays, maps, strings, numbers, booleans, and null.
JSON-LD Processor
