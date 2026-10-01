---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-156-e-changes-since-10-recommendation-of-16-january
section_title: "E. Changes since 1.0 Recommendation of 16 January 2014"
section_number: null
pages: 91-92
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
@container values within an expanded term definition may now include @id, @graph and @type, corresponding to id maps and type maps.
An expanded term definition can now have an @nest property, which identifies a term expanding to @nest which is used for containing
properties using the same @nest mapping. When expanding, the values of a property expanding to @nest are treated as if they were contained
within the enclosing node object directly.
The JSON syntax has been abstracted into an internal representation to allow for other serializations that are functionally equivalent to JSON.
Added § 4.6.3 Node Identifier Indexing and § 4.6.4 Node Type Indexing.
Both language maps and index maps may legitimately have an @none key, but JSON-LD 1.0 only allowed string keys. This has been updated to
allow @none keys.
The value for @container in an expanded term definition can also be an array containing any appropriate container keyword along with @set
(other than @list). This allows a way to ensure that such property values will always be expressed in array form.
In JSON-LD 1.1, terms will be chosen as compact IRI prefixes when compacting only if a simple term definition is used where the value ends
with a URI gen-delim character, or if their expanded term definition contains a @prefix entry with the value true. The 1.0 algorithm has been
updated to only consider terms that map to a value that ends with a URI gen-delim character.
Values of properties where the associated term definition has @container set to @graph are interpreted as implicitly named graphs, where the
associated graph name is assigned from a new blank node identifier. Other combinations include ["@container", "@id"], ["@container",
"@index"] each also may include "@set", which create maps from the graph identifier or index value similar to index maps and id maps.
