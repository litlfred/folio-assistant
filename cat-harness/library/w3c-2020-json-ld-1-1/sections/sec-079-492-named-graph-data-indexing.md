---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-079-492-named-graph-data-indexing
section_title: "Named Graph Data Indexing"
section_number: 4.9.2
pages: 56-57
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
As with index maps, when used with @graph, a container may also include @set to ensure that key values are always contained in an array.
The special index @none is used for indexing graphs which do not have an @index key, which is useful to maintain a normalized representation. Note,
however, that compacting a document where multiple unidentified named graphs are compacted using the @none index will result in the content of
those graphs being merged. To prevent this, give each graph a distinct @index key.
Note
Named Graph Data Indexing is a new feature in JSON-LD 1.1.
This section is non-normative.
Input
Example 119: Indexing graph data in JSON-LD
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
     "@version": 1.1,
     "schema": "http://schema.org/",
     "name": "schema:name",
     "body": "schema:articleBody",
     "words": "schema:wordCount",
     "post": {
       "@id": "schema:blogPost",
       "@container": ["@graph", "@index"]
     }
  },
  "@id": "http://example.com/",
  "@type": "schema:Blog",
  "name": "World Financial News",
  "post": {
     "en": {
       "@id": "http://example.com/posts/1/en",
       "body": "World commodities were up today with heavy trading of crude oil...",
       "words": 1539
     },
     "de": {
       "@id": "http://example.com/posts/1/de",
       "body": "Die Werte an Warenbörsen stiegen im Sog eines starken Handels von Rohöl...",
       "words": 1204
     }
  }
}
Input
Example 120: Indexing graphs using @none for no index
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
     "@version": 1.1,
     "schema": "http://schema.org/",
     "name": "schema:name",
     "body": "schema:articleBody",
     "words": "schema:wordCount",
     "post": {
       "@id": "schema:blogPost",
       "@container": ["@graph", "@index"]
     }
  },
  "@id": "http://example.com/",
  "@type": "schema:Blog",
  "name": "World Financial News",
  "post": {
     "en": {
       "@id": "http://example.com/posts/1/en",
       "body": "World commodities were up today with heavy trading of crude oil...",
       "words": 1539
     },
     "@none": {
       "@id": "http://example.com/posts/1/no-language",
       "body": "Die Werte an Warenbörsen stiegen im Sog eines starken Handels von Rohöl...",
       "words": 1204
     }
  }
}
