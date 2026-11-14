---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-080-493-named-graph-indexing
section_title: "Named Graph Indexing"
section_number: 4.9.3
pages: 57-59
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
In addition to indexing node objects by identifier, graph objects may also be indexed by their graph name. By using the @graph container type,
introduced in § 4.9.1 Graph Containers in addition to @id, an object value of such a property is treated as a key-value map where the keys represent
the identifiers of named graphs which are their values.
The following example describes a default graph referencing multiple named graphs using an id map.
As with id maps, when used with @graph, a container may also include @set to ensure that key values are always contained in an array.
As with id maps, the special index @none is used for indexing named graphs which do not have an @id, which is useful to maintain a normalized
representation. The @none index may also be a term which expands to @none. Note, however, that if multiple graphs are represented without an @id,
they will be merged on expansion. To prevent this, use @none judiciously, and consider giving graphs their own distinct identifier.
Input
Example 121: Referencing named graphs using an id map
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
    "@version": 1.1,
    "generatedAt": {
      "@id": "http://www.w3.org/ns/prov#generatedAtTime",
      "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
    },
    "Person": "http://xmlns.com/foaf/0.1/Person",
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": {
      "@id": "http://xmlns.com/foaf/0.1/knows",
      "@type": "@id"
    },
    "graphMap": {
      "@id": "http://example.org/graphMap",
      "@container": ["@graph", "@id"]
    }
  },
  "@id": "http://example.org/foaf-graph",
  "generatedAt": "2012-04-09T00:00:00",
  "graphMap": {
    "http://manu.sporny.org/about": {
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "Person",
      "name": "Manu Sporny",
      "knows": "https://greggkellogg.net/foaf#me"
    },
    "https://greggkellogg.net/foaf": {
      "@id": "https://greggkellogg.net/foaf#me",
      "@type": "Person",
      "name": "Gregg Kellogg",
      "knows": "http://manu.sporny.org/about#manu"
    }
  }
}
Input
Example 122: Referencing named graphs using an id map with @none
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
    "@version": 1.1,
    "generatedAt": {
      "@id": "http://www.w3.org/ns/prov#generatedAtTime",
      "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
    },
    "Person": "http://xmlns.com/foaf/0.1/Person",
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": {"@id": "http://xmlns.com/foaf/0.1/knows", "@type": "@id"},
    "graphMap": {
      "@id": "http://example.org/graphMap",
      "@container": ["@graph", "@id"]
    }
  },
  "@id": "http://example.org/foaf-graph",
  "generatedAt": "2012-04-09T00:00:00",
  "graphMap": {
    "@none": [{
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "Person",
      "name": "Manu Sporny",
      "knows": "https://greggkellogg.net/foaf#me"
    }, {
      "@id": "https://greggkellogg.net/foaf#me",
