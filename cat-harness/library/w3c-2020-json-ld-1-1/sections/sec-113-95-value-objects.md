---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-113-95-value-objects
section_title: "Value Objects"
section_number: 9.5
pages: 76-77
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
A value object MUST be a map containing the @value key. It MAY also contain an @type, an @language, an @direction, an @index, or an @context
key but MUST NOT contain both an @type and either @language or @direction keys at the same time. A value object MUST NOT contain any other
keys that expand to an IRI or keyword.
The value associated with the @value key MUST be either a string, a number, true, false or null. If the value associated with the @type key is
@json, the value MAY be either an array or an object.
The value associated with the @type key MUST be a term, an IRI, a compact IRI, a string which can be turned into an IRI using the vocabulary
mapping, @json, or null.
The value associated with the @language key MUST have the lexical form described in [BCP47], or be null.
The value associated with the @direction key MUST be one of "ltr" or "rtl", or be null.
The value associated with the @index key MUST be a string.
See § 4.2.1 Typed Values and § 4.2.4 String Internationalization for more information on value objects.
When framing, a value pattern extends a value object to allow entries used specifically for framing.
The values of @value, @language, @direction and @type MAY additionally be an empty map (wildcard), an array containing only an empty
map, an empty array (match none), an array of strings.
A list represents an ordered set of values. A set represents an unordered set of values. Unless otherwise specified, arrays are unordered in JSON-LD.
As such, the @set keyword, when used in the body of a JSON-LD document, represents just syntactic sugar which is optimized away when
processing the document. However, it is very helpful when used within the context of a document. Values of terms associated with an @set or @list
container will always be represented in the form of an array when a document is processed—even if there is just a single value that would otherwise
be optimized to a non-array form in compacted document form. This simplifies post-processing of the data as the data is always in a deterministic
form.
A list object MUST be a map that contains no keys that expand to an IRI or keyword other than @list and @index.
A set object MUST be a map that contains no keys that expand to an IRI or keyword other than @set and @index. Please note that the @index key will
be ignored when being processed.
In both cases, the value associated with the keys @list and @set MUST be one of the following types:
string,
number,
true,
false,
null,
node object,
value object, or
an array of zero or more of the above possibilities
See § 4.3 Value Ordering for further discussion on sets and lists.
A language map is used to associate a language with a value in a way that allows easy programmatic access. A language map may be used as a term
value within a node object if the term is defined with @container set to @language, or an array containing both @language and @set . The keys of a
language map MUST be strings representing [BCP47] language tags, the keyword @none, or a term which expands to @none, and the values MUST be
any of the following types:
null,
string, or
an array of zero or more of the strings
