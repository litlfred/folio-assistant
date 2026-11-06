---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-157-f-changes-since-json-ld-community-group-final-re
section_title: "F. Changes since JSON-LD Community Group Final Report"
section_number: null
pages: 92-92
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
This section is non-normative.
Lists may now have items which are themselves lists.
Values of @type, or an alias of @type, may now have their @container set to @set to ensure that @type entries are always represented as an
array. This also allows a term to be defined for @type, where the value MUST be a map with @container set to @set.
The use of blank node identifiers to label properties is obsolete, and may be removed in a future version of JSON-LD, as is the support for
generalized RDF Datasets.
The vocabulary mapping can be a relative IRI reference, which is evaluated either against an existing default vocabulary, or against the
document base. This allows vocabulary-relative IRIs, such as the keys of node objects, are expanded or compacted relative to the document
base. (See Security Considerations in § C. IANA Considerations for a discussion on how string vocabulary-relative IRI resolution via
concatenation. )
Added support for "@type": "@none" in a term definition to prevent value compaction. Define the rdf:JSON datatype.
Term definitions with keys which are of the form of an IRI reference or a compact IRI MUST NOT expand to an IRI other than the expansion of
the key itself.
A frame may also be located within an HTML document, identified using type
application/ld+json;profile=http://www.w3.org/ns/json-ld#frame.
Term definitions can now be protected, to limit the ability of other contexts to override them.
A context defined in an expanded term definition may also be used for values of @type, which defines a context to use for node objects
including the associated type.
By default, all contexts are propagated when traversing node objects, other than type-scoped contexts. This can be controlled using the
@propagate entry in a local context.
A context may contain an @import entry used to reference a remote context within a context, allowing JSON-LD 1.1 features to be added to
contexts originally authored for JSON-LD 1.0.
A node object may include an included block, which is used to contain a set of node objects which are treated exactly as if they were node
objects defined in an array including the containing node object. This allows the use of the object form of a JSON-LD document when there is
more than one node object being defined, and where those node objects are not embedded as values of the containing node object.
The alternate link relation can be used to supply an alternate location for retrieving a JSON-LD document when the returned document is not
JSON.
Value objects, and associated context and term definitions have been updated to support @direction for setting the base direction of strings.
The processing mode is now implicitly json-ld-1.1, unless set explicitly to json-ld-1.0.
Improve notation using IRI, IRI reference, and relative IRI reference.
Warn about forward-compatibility issues for terms of the form ("@"1*ALPHA).
When creating an i18n datatype or rdf:CompoundLiteral, language tags are normalized to lower case to improve interoperability between
implementations.
This section is non-normative.
Expand § 4.1.5 Compact IRIs to describe the behavior of "@prefix": false for compact IRIs, and to note that this affects both expansion of
compact IRIs and compaction of IRIs to compact IRIs.
Adding a missing normative definition of the @index keyword used within an expanded term definition to § 9.15.1 Expanded term definition.
Changed normative definition of the rdf:JSON datatype in § 10.2 The rdf:JSON Datatype to describe a normative canonicalization. This is in
response to Issue 323.
Updated the non-normative definitions of the i18n based datatype in § 10.3 The i18n Namespace and rdf:CompoundLiteral class in § 10.4
The rdf:CompoundLiteral class and the rdf:language and rdf:direction properties to normalize language tags to lowercase when
generating RDF.
F. Changes since JSON-LD Community Group Final Report §
