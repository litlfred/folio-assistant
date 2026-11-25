---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-060-431-lists
section_title: "Lists"
section_number: 4.3.1
pages: 41-42
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
In JSON-LD 1.1, lists of lists, where the value of a list object, may itself be a list object, are fully supported.
Note that the "@container": "@list" definition recursively describes array values of lists as being, themselves, lists. For example, in The GeoJSON
Format (see [RFC7946]), coordinates are an ordered list of positions, which are represented as an array of two or more numbers:
Input
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {"ex": "http://example.org/"},
  "@id": "http://example.org/people#michael",
  "ex:name": [
    "Michael",
    {"@value": "Mike"},
    {"@value": "Miguel", "@language": "es"},
    { "@id": "https://www.wikidata.org/wiki/Q4927524" },
    42
  ]
}
4.3.1 Lists §
Input
Example 81: An ordered collection of values in JSON-LD
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {"foaf": "http://xmlns.com/foaf/0.1/"},
  ...
  "@id": "http://example.org/people#joebob",
  "foaf:nick": {
    "@list": [ "joe", "bob", "jaybee" ]
  },
  ...
}
Input
Example 82: Specifying that a collection is ordered in the context
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    ...
    "nick": {
      "@id": "http://xmlns.com/foaf/0.1/nick",
      "@container": "@list"
    }
  },
  ...
  "@id": "http://example.org/people#joebob",
  "nick": [ "joe", "bob", "jaybee" ],
  ...
}
Example 83: Coordinates expressed in GeoJSON
{
  "type": "Feature",
  "bbox": [-10.0, -10.0, 10.0, 10.0],
For these examples, it's important that values expressed within bbox and coordinates maintain their order, which requires the use of embedded list
structures. In JSON-LD 1.1, we can express this using recursive lists, by simply adding the appropriate context definition:
Note that coordinates includes three levels of lists.
Values of terms associated with an @list container are always represented in the form of an array, even if there is just a single value or no value at all.
This section is non-normative.
While @list is used to describe ordered lists, the @set keyword is used to describe unordered sets. The use of @set in the body of a JSON-LD
document is optimized away when processing the document, as it is just syntactic sugar. However, @set is helpful when used within the context of a
document. Values of terms associated with an @set container are always represented in the form of an array, even if there is just a single value that
would otherwise be optimized to a non-array form in compact form (see § 5.2 Compacted Document Form). This makes post-processing of JSON-LD
documents easier as the data is always in array form, even if the array only contains a single value.
This describes the use of this array as being unordered, and order may change when processing a document. By default, arrays of values are
unordered, but this may be made explicit by setting @container to @set in the context:
  "geometry": {
    "type": "Polygon",
    "coordinates": [
        [
            [-10.0, -10.0],
            [10.0, -10.0],
            [10.0, 10.0],
            [-10.0, -10.0]
        ]
    ]
  }
  //...
}
Input
Example 84: Coordinates expressed in JSON-LD
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "https://purl.org/geojson/vocab#",
    "type": "@type",
    "bbox": {"@container": "@list"},
    "coordinates": {"@container": "@list"}
  },
  "type": "Feature",
  "bbox": [-10.0, -10.0, 10.0, 10.0],
  "geometry": {
    "type": "Polygon",
    "coordinates": [
        [
            [-10.0, -10.0],
            [10.0, -10.0],
            [10.0, 10.0],
            [-10.0, -10.0]
        ]
    ]
  }
  //...
}
