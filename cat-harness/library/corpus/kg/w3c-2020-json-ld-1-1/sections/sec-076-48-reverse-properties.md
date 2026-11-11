---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-076-48-reverse-properties
section_title: "Reverse Properties"
section_number: 4.8
pages: 54-56
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 112: A document with children linking to their parent
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
[
  {
    "@id": "#homer",
    "http://example.com/vocab#name": "Homer"
  }, {
    "@id": "#bart",
    "http://example.com/vocab#name": "Bart",
    "http://example.com/vocab#parent": { "@id": "#homer" }
  }, {
    "@id": "#lisa",
    "http://example.com/vocab#name": "Lisa",
    "http://example.com/vocab#parent": { "@id": "#homer" }
  }
]
Input
Example 113: A person and its children using a reverse property
Compacted (Input) 
Expanded (Result) 
Flattened 
Statements 
Turtle Open in playground
{
  "@id": "#homer",
  "http://example.com/vocab#name": "Homer",
  "@reverse": {
    "http://example.com/vocab#parent": [
      {
        "@id": "#bart",
        "http://example.com/vocab#name": "Bart"
      }, {
        "@id": "#lisa",
        "http://example.com/vocab#name": "Lisa"
      }
    ]
  }
}
Input
Example 114: Using @reverse to define reverse properties
Compacted (Input) 
Expanded (Result) 
Flattened 
Statements 
Turtle Open in playground
{
  "@context": { "name": "http://example.com/vocab#name",
    "children": { "@reverse": "http://example.com/vocab#parent" }
  },
  "@id": "#homer",
  "name": "Homer",
  "children": [
    {
      "@id": "#bart",
      "name": "Bart"
    }, {
      "@id": "#lisa",
      "name": "Lisa"
    }
  ]
}
This section is non-normative.
At times, it is necessary to make statements about a graph itself, rather than just a single node. This can be done by grouping a set of nodes using the
@graph keyword. A developer may also name data expressed using the @graph keyword by pairing it with an @id keyword as shown in the following
example:
The example above expresses a named graph that is identified by the IRI http://example.org/foaf-graph. That graph is composed of the
statements about Manu and Gregg. Metadata about the graph itself is expressed via the generatedAt property, which specifies when the graph was
generated.
When a JSON-LD document's top-level structure is a map that contains no other keys than @graph and optionally @context (properties that are not
mapped to an IRI or a keyword are ignored), @graph is considered to express the otherwise implicit default graph. This mechanism can be useful
when a number of nodes exist at the document's top level that share the same context, which is, e.g., the case when a document is flattened. The
@graph keyword collects such nodes in an array and allows the use of a shared context.
In this case, embedding can not be used as the graph contains unrelated nodes. This is equivalent to using multiple node objects in array and defining
the @context within each node object:
4.9 Named Graphs §
Input
Example 115: Identifying and making statements about a graph
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
    "generatedAt": {
      "@id": "http://www.w3.org/ns/prov#generatedAtTime",
      "@type": "http://www.w3.org/2001/XMLSchema#dateTime"
    },
    "Person": "http://xmlns.com/foaf/0.1/Person",
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": {"@id": "http://xmlns.com/foaf/0.1/knows", "@type": "@id"}
  },
  "@id": "http://example.org/foaf-graph",
  "generatedAt": "2012-04-09T00:00:00",
  "@graph": [
    {
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "Person",
      "name": "Manu Sporny",
      "knows": "https://greggkellogg.net/foaf#me"
    }, {
      "@id": "https://greggkellogg.net/foaf#me",
      "@type": "Person",
      "name": "Gregg Kellogg",
      "knows": "http://manu.sporny.org/about#manu"
    }
  ]
}
Input
Example 116: Using @graph to explicitly express the default graph
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
{
  "@context": {
    "@vocab": "http://xmlns.com/foaf/0.1/"
  },
  "@graph": [
    {
      "@id": "http://manu.sporny.org/about#manu",
      "@type": "Person",
      "name": "Manu Sporny"
    }, {
      "@id": "https://greggkellogg.net/foaf#me",
      "@type": "Person",
      "name": "Gregg Kellogg"
    }
  ]
}
Example 117: Context needs to be duplicated if @graph is not used
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
 Open in playground
[
  {
This section is non-normative.
In some cases, it is useful to logically partition data into separate graphs, without making this explicit within the JSON expression. For example, a
JSON document may contain data against which other metadata is asserted and it is useful to separate this data in the data model using the notion of
named graphs, without the syntactic overhead associated with the @graph keyword.
An expanded term definition can use @graph as the value of @container. This indicates that values of this term should be considered to be named
graphs, where the graph name is an automatically assigned blank node identifier creating an implicitly named graph. When expanded, these become
simple graph objects.
A different example uses an anonymously named graph as follows:
The example above expresses an anonymously named graph making a statement. The default graph includes a statement saying that the subject wrote
that statement. This is an example of separating statements into a named graph, and then making assertions about the statements contained within that
named graph.
