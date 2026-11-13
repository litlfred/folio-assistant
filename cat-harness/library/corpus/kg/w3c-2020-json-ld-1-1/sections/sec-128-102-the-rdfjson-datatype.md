---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-128-102-the-rdfjson-datatype
section_title: "The rdf:JSON Datatype"
section_number: 10.2
pages: 83-84
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The IRI denoting this datatype
is http://www.w3.org/1999/02/22-rdf-syntax-ns#JSON.
The lexical space
is the set of UNICODE [UNICODE] strings which conform to the JSON Grammar as described in Section 2 JSON Grammar of [RFC8259].
The value space
Example 151: Sample JSON-LD document
{
  "@context": {
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": "http://xmlns.com/foaf/0.1/knows"
  },
  "@id": "http://me.markus-lanthaler.com/",
  "name": "Markus Lanthaler",
  "knows": [
    {
      "@id": "http://manu.sporny.org/about#manu",
      "name": "Manu Sporny"
    }, {
      "name": "Dave Longley"
    }
  ]
}
Example 152: Flattened and expanded form for the previous example
[
  {
    "@id": "_:b0",
    "http://xmlns.com/foaf/0.1/name": "Dave Longley"
  }, {
    "@id": "http://manu.sporny.org/about#manu",
    "http://xmlns.com/foaf/0.1/name": "Manu Sporny"
  }, {
    "@id": "http://me.markus-lanthaler.com/",
    "http://xmlns.com/foaf/0.1/name": "Markus Lanthaler",
    "http://xmlns.com/foaf/0.1/knows": [
      { "@id": "http://manu.sporny.org/about#manu" },
      { "@id": "_:b0" }
    ]
  }
]
Example 153: Turtle representation of expanded/flattened document
@prefix foaf: <http://xmlns.com/foaf/0.1/> .
_:b0 foaf:name "Dave Longley" .
<http://manu.sporny.org/about#manu> foaf:name "Manu Sporny" .
<http://me.markus-lanthaler.com/> foaf:name "Markus Lanthaler" ;
    foaf:knows <http://manu.sporny.org/about#manu>, _:b0 .
10.2 The rdf:JSON Datatype §
is the set of UNICODE [UNICODE] strings which conform to the JSON Grammar as described in Section 2 JSON Grammar of [RFC8259], and
furthermore comply with the following constraints:
It MUST NOT contain any unnecessary whitespace,
Keys in objects MUST be ordered lexicographically,
Native Numeric values MUST be serialized according to Section 7.1.12.1 of [ECMASCRIPT],
Strings MUST be serialized with Unicode codepoints from U+0000 through U+001F using lower case hexadecimal Unicode notation (\uhhhh)
unless in the set of predefined JSON control characters U+0008, U+0009, U+000A, U+000C or U+000D which SHOULD be serialized as \b, \t, \n,
\f and \r respectively. All other Unicode characters SHOULD be serialized "as is", other than U+005C (\) and U+0022 (") which SHOULD be
serialized as \\ and \" respectively.
