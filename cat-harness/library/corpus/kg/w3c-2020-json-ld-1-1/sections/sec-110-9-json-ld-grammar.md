---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-110-9-json-ld-grammar
section_title: "JSON-LD Grammar"
section_number: 9
pages: 75-76
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
9.1 Terms §
9.2 Node Objects §
If the node object contains the @type key, its value MUST be either an IRI reference, a compact IRI (including blank node identifiers), a term defined
in the active context expanding into an IRI, or an array of any of these. See § 3.5 Specifying the Type for further discussion on @type values.
If the node object contains the @reverse key, its value MUST be a map containing entries representing reverse properties. Each value of such a
reverse property MUST be an IRI reference, a compact IRI, a blank node identifier, a node object or an array containing a combination of these.
If the node object contains the @included key, its value MUST be an included block. See § 9.13 Included Blocks for further discussion on included
blocks.
If the node object contains the @index key, its value MUST be a string. See § 4.6.1 Data Indexing for further discussion on @index values.
If the node object contains the @nest key, its value MUST be a map or an array of map which MUST NOT include a value object. See § 9.14 Property
Nesting for further discussion on @nest values.
Keys in a node object that are not keywords MAY expand to an IRI using the active context. The values associated with keys that expand to an IRI
MUST be one of the following:
string,
number,
true,
false,
null,
node object,
graph object,
value object,
list object,
set object,
an array of zero or more of any of the possibilities above,
a language map,
an index map,
an included block
an id map, or
a type map
When framing, a frame object extends a node object to allow entries used specifically for framing.
A frame object MAY include a default object as the value of any key which is not a keyword. Values of @default MAY include the value @null,
or an array containing only @null, in addition to other values allowed in the grammar for values of entry keys expanding to IRIs.
The values of @id and @type MAY additionally be an empty map (wildcard), an array containing only an empty map, an empty array (match
none) an array of IRIs.
A frame object MAY include an entry with the key @embed with any value from @always, @once, and @never.
A frame object MAY include entries with the boolean valued keys @explicit, @omitDefault, or @requireAll
In addition to other property values, a property of a frame object MAY include a value pattern (See § 9.6 Value Patterns).
