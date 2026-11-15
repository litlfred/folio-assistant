---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-026-35-specifying-the-type
section_title: "Specifying the Type"
section_number: 3.5
pages: 16-17
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 14: Specifying the type for a node
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    ...
    "givenName": "http://schema.org/givenName",
    "familyName": "http://schema.org/familyName"
  },
  "@id": "http://me.markus-lanthaler.com/",
  "@type": "http://schema.org/Person",
  "givenName": "Markus",
  "familyName": "Lanthaler",
  ...
}
Input
Example 15: Specifying multiple types for a node
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  ...
  "@id": "http://me.markus-lanthaler.com/",
  "@type": [
     "http://schema.org/Person",
     "http://xmlns.com/foaf/0.1/Person"
    ],
  ...
}
Input
Example 16: Using a term to specify the type
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
In addition to setting the type of nodes, @type can also be used to set the type of a value to create a typed value. This use of @type is similar to that
used to define the type of a node object, but value objects are restricted to having just a single type. The use of @type to create typed values is
discussed more fully in § 4.2.1 Typed Values.
Typed values can also be defined implicitly, by specifying @type in an expanded term definition. This is covered more fully in § 4.2.3 Type Coercion.
This section is non-normative.
JSON-LD has a number of features that provide functionality above and beyond the core functionality described above. JSON can be used to express
data using such structures, and the features described in this section can be used to interpret a variety of different JSON structures as Linked Data. A
JSON-LD processor will make use of provided and embedded contexts to interpret property values in a number of different idiomatic ways.
Describing values
One pattern in JSON is for the value of a property to be a string. Often times, this string actually represents some other typed value, for example an
IRI, a date, or a string in some specific language. See § 4.2 Describing Values for details on how to describe such value typing.
Value ordering
In JSON, a property with an array value implies an implicit order; arrays in JSON-LD do not convey any ordering of the contained elements by
default, unless defined using embedded structures or through a context definition. See § 4.3 Value Ordering for a further discussion.
Property nesting
Another JSON idiom often found in APIs is to use an intermediate object to group together related properties of an object; in JSON-LD these are
referred to as nested properties and are described in § 4.4 Nested Properties.
Referencing objects
Linked Data is all about describing the relationships between different resources. Sometimes these relationships are between resources defined in
different documents described on the web, sometimes the resources are described within the same document.
In this case, a document residing at http://manu.sporny.org/about may contain the example above, and reference another document at
https://greggkellogg.net/foaf which could include a similar representation.
A common idiom found in JSON usage is objects being specified as the value of other objects, called object embedding in JSON-LD; for example, a
friend specified as an object value of a Person:
    ...
    "Person": "http://schema.org/Person"
  },
  "@id": "http://example.org/places#BrewEats",
  "@type": "Person",
  ...
}
