---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-085-5-forms-of-json-ld
section_title: "Forms of JSON-LD"
section_number: 5
pages: 59-61
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
5.1 Expanded Document Form §
Input
Example 123: Sample JSON-LD document to be expanded
{
   "@context": {
      "name": "http://xmlns.com/foaf/0.1/name",
      "homepage": {
        "@id": "http://xmlns.com/foaf/0.1/homepage",
        "@type": "@id"
      }
   },
Running the JSON-LD Expansion algorithm against the JSON-LD input document provided above would result in the following output:
JSON-LD's media type defines a profile parameter which can be used to signal or request expanded document form. The profile URI identifying
expanded document form is http://www.w3.org/ns/json-ld#expanded.
This section is non-normative.
The JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API] defines a method for compacting a JSON-LD document.
Compaction is the process of applying a developer-supplied context to shorten IRIs to terms or compact IRIs and JSON-LD values expressed in
expanded form to simple values such as strings or numbers. Often this makes it simpler to work with document as the data is expressed in
application-specific terms. Compacted documents are also typically easier to read for humans.
For example, assume the following JSON-LD input document:
Additionally, assume the following developer-supplied JSON-LD context:
Running the JSON-LD Compaction algorithm given the context supplied above against the JSON-LD input document provided above would result in
the following output:
   "name": "Manu Sporny",
   "homepage": "http://manu.sporny.org/"
}
Result
Example 124: Expanded form for the previous example
Expanded (Result) 
Statements 
Turtle Open in playground
[
  {
    "http://xmlns.com/foaf/0.1/name": [
      { "@value": "Manu Sporny" }
    ],
    "http://xmlns.com/foaf/0.1/homepage": [
      { "@id": "http://manu.sporny.org/" }
    ]
  }
]
5.2 Compacted Document Form §
Input
Example 125: Sample expanded JSON-LD document
[
  {
    "http://xmlns.com/foaf/0.1/name": [ "Manu Sporny" ],
    "http://xmlns.com/foaf/0.1/homepage": [
      {
       "@id": "http://manu.sporny.org/"
      }
    ]
  }
]
Context
Example 126: Sample context
{
  "@context": {
    "name": "http://xmlns.com/foaf/0.1/name",
    "homepage": {
      "@id": "http://xmlns.com/foaf/0.1/homepage",
      "@type": "@id"
    }
  }
}
Example 127: Compact form of the sample document once sample context has been applied
JSON-LD's media type defines a profile parameter which can be used to signal or request compacted document form. The profile URI identifying
compacted document form is http://www.w3.org/ns/json-ld#compacted.
The details of Compaction are described in the Compaction algorithm in [JSON-LD11-API]. This section provides a short description of how the
algorithm operates as a guide to authors creating contexts to be used for compacting JSON-LD documents.
The purpose of compaction is to apply the term definitions, vocabulary mapping, default language, and base IRI to an existing JSON-LD document to
cause it to be represented in a form that is tailored to the use of the JSON-LD document directly as JSON. This includes representing values as
strings, rather than value objects, where possible, shortening the use of list objects into simple arrays, reversing the relationship between nodes, and
using data maps to index into multiple values instead of representing them as an array of values.
This section is non-normative.
In an expanded JSON-LD document, IRIs are always represented as absolute IRIs. In many cases, it is preferable to use a shorter version, either a
relative IRI reference, compact IRI, or term. Compaction uses a combination of elements in a context to create a shorter form of these IRIs. See
§ 4.1.2 Default Vocabulary, § 4.1.3 Base IRI, and § 4.1.5 Compact IRIs for more details.
The vocabulary mapping can be used to shorten IRIs that may be vocabulary relative by removing the IRI prefix that matches the vocabulary
mapping. This is done whenever an IRI is determined to be vocabulary relative, i.e., used as a property, or a value of @type, or as the value of a term
described as "@type": "@vocab".
{
  "@context": {
    "name": "http://xmlns.com/foaf/0.1/name",
    "homepage": {
      "@id": "http://xmlns.com/foaf/0.1/homepage",
      "@type": "@id"
    }
  },
  "name": "Manu Sporny",
  "homepage": "http://manu.sporny.org/"
}
