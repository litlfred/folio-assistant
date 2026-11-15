---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-028-41-advanced-context-usage
section_title: "Advanced Context Usage"
section_number: 4.1
pages: 18-19
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 19: Using multiple contexts
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
[
  {
    "@context": "https://json-ld.org/contexts/person.jsonld",
    "name": "Manu Sporny",
    "homepage": "http://manu.sporny.org/",
    "depiction": "http://twitter.com/account/profile_image/manusporny"
  }, {
    "@context": "https://json-ld.org/contexts/place.jsonld",
    "name": "The Empire State Building",
    "description": "The Empire State Building is a 102-story landmark in New York City.",
    "geo": {
      "latitude": "40.75",
      "longitude": "73.98"
    }
  }
]
Input
Example 20: Describing disconnected nodes with @graph
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": [
    "https://json-ld.org/contexts/person.jsonld",
    "https://json-ld.org/contexts/place.jsonld",
    {"title": "http://purl.org/dc/terms/title"}
  ],
  "@graph": [{
    "http://xmlns.com/foaf/0.1/name": "Manu Sporny",
    "homepage": "http://manu.sporny.org/",
    "depiction": "http://twitter.com/account/profile_image/manusporny"
  }, {
    "title": "The Empire State Building",
    "description": "The Empire State Building is a 102-story landmark in New York City.",
    "geo": {
      "latitude": "40.75",
      "longitude": "73.98"
    }
Duplicate context terms are overridden using a most-recently-defined-wins mechanism.
In the example above, the name term is overridden in the more deeply nested details structure, which uses its own embedded context. Note that this
is rarely a good authoring practice and is typically used when working with legacy applications that depend on a specific structure of the map. If a
term is redefined within a context, all previous rules associated with the previous definition are removed. If a term is redefined to null, the term is
effectively removed from the list of terms defined in the active context.
Multiple contexts may be combined using an array, which is processed in order. The set of contexts defined within a specific map are referred to as
local contexts. The active context refers to the accumulation of local contexts that are in scope at a specific point within the document. Setting a local
context to null effectively resets the active context to an empty context, without term definitions, default language, or other things defined within
previous contexts. The following example specifies an external context and then layers an embedded context on top of the external context:
In JSON-LD 1.1, there are other mechanisms for introducing contexts, including scoped contexts and imported contexts, and there are new ways of
protecting term definitions, so there are cases where the last defined inline context is not necessarily one which defines the scope of terms. See § 4.1.8
Scoped Contexts, § 4.1.9 Context Propagation, § 4.1.10 Imported Contexts, and § 4.1.11 Protected Term Definitions for further information.
