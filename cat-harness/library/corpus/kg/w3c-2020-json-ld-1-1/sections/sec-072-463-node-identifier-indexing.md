---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-072-463-node-identifier-indexing
section_title: "Node Identifier Indexing"
section_number: 4.6.3
pages: 49-51
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 103: Indexing data in JSON-LD by node identifiers
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "schema": "http://schema.org/",
    "name": "schema:name",
    "body": "schema:articleBody",
    "words": "schema:wordCount",
    "post": {
      "@id": "schema:blogPost",
      "@container": "@id",
      "@context": {
        "@base": "http://example.com/posts/"
      }
    }
  },
  "@id": "http://example.com/",
In the example above, the post term has been marked as an id map. The http://example.com/posts/1/en and http://example.com/posts/1/de
keys will be interpreted as the @id property of the node object value.
The interpretation of the data above is exactly the same as that in § 4.6.1 Data Indexing using a JSON-LD processor.
The value of @container can also be an array containing both @id and @set. When compacting, this ensures that a JSON-LD processor will use the
array form for all values of node identifiers.
The special index @none is used for indexing node objects which do not have an @id, which is useful to maintain a normalized representation. The
@none index may also be a term which expands to @none, such as the term none used in the example below.
  "@type": "schema:Blog",
  "name": "World Financial News",
  "post": {
    "1/en": {
      "body": "World commodities were up today with heavy trading of crude oil...",
      "words": 1539
    },
    "1/de": {
      "body": "Die Werte an Warenbörsen stiegen im Sog eines starken Handels von Rohöl...",
      "words": 1204
    }
  }
}
Input
Example 104: Indexing data in JSON-LD by node identifiers with @set representation
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "schema": "http://schema.org/",
    "name": "schema:name",
    "body": "schema:articleBody",
    "words": "schema:wordCount",
    "post": {
      "@id": "schema:blogPost",
      "@container": ["@id", "@set"]
    }
  },
  "@id": "http://example.com/",
  "@type": "schema:Blog",
  "name": "World Financial News",
  "post": {
    "http://example.com/posts/1/en": [{
      "body": "World commodities were up today with heavy trading of crude oil...",
      "words": 1539
    }],
    "http://example.com/posts/1/de": [{
      "body": "Die Werte an Warenbörsen stiegen im Sog eines starken Handels von Rohöl...",
      "words": 1204
    }]
  }
}
Input
Example 105: Indexing data in JSON-LD by node identifiers using @none
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "schema": "http://schema.org/",
    "name": "schema:name",
    "body": "schema:articleBody",
    "words": "schema:wordCount",
    "post": {
      "@id": "schema:blogPost",
      "@container": "@id"
    },
    "none": "@none"
  },
  "@id": "http://example.com/",
  "@type": "schema:Blog",
  "name": "World Financial News",
  "post": {
    "http://example.com/posts/1/en": {
      "body": "World commodities were up today with heavy trading of crude oil...",
