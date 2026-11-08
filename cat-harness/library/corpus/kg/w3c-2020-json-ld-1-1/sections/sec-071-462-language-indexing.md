---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-071-462-language-indexing
section_title: "Language Indexing"
section_number: 4.6.2
pages: 48-49
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 100: Indexing languaged-tagged strings in JSON-LD
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "vocab": "http://example.com/vocab/",
    "label": {
      "@id": "vocab:label",
      "@container": "@language"
    }
  },
  "@id": "http://example.com/queen",
  "label": {
    "en": "The Queen",
    "de": [ "Die Königin", "Ihre Majestät" ]
  }
}
In the example above, the label term has been marked as a language map. The en and de keys are implicitly associated with their respective values by
the JSON-LD Processor. This allows a developer to access the German version of the label using the following code snippet: obj.label.de, which,
again, is only appropriate when languages are limited to the primary language sub-tag and do not depend on other sub-tags, such as "de-at".
The value of @container can also be an array containing both @language and @set. When compacting, this ensures that a JSON-LD Processor will
use the array form for all values of language tags.
Unless the processing mode is set to json-ld-1.0, the special index @none is used for indexing strings which do not have a language; this is useful to
maintain a normalized representation for string values not having a datatype.
This section is non-normative.
In addition to index maps, JSON-LD introduces the notion of id maps for structuring data. The id indexing feature allows an author to structure data
using a simple key-value map where the keys map to IRIs. This enables direct access to associated node objects instead of having to scan an array in
search of a specific item. In JSON-LD such data can be specified by associating the @id keyword with a @container declaration in the context:
Input
Example 101: Indexing languaged-tagged strings in JSON-LD with @set representation
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "vocab": "http://example.com/vocab/",
    "label": {
      "@id": "vocab:label",
      "@container": ["@language", "@set"]
    }
  },
  "@id": "http://example.com/queen",
  "label": {
    "en": ["The Queen"],
    "de": [ "Die Königin", "Ihre Majestät" ]
  }
}
Input
Example 102: Indexing languaged-tagged strings using @none for no language
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "vocab": "http://example.com/vocab/",
    "label": {
      "@id": "vocab:label",
      "@container": "@language"
    }
  },
  "@id": "http://example.com/queen",
  "label": {
    "en": "The Queen",
    "de": [ "Die Königin", "Ihre Majestät" ],
    "@none": "The Queen"
  }
}
