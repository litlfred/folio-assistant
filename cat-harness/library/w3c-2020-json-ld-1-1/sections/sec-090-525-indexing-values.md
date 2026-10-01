---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-090-525-indexing-values
section_title: "Indexing Values"
section_number: 5.2.5
pages: 64-65
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Context
Example 133: Indexing language-tagged strings
Given the following expanded document:
[{
  "@id": "http://example.com/queen",
  "http://example.com/vocab/label": [
    {"@value": "The Queen", "@language": "en"},
    {"@value": "Die Königin", "@language": "de"},
    {"@value": "Ihre Majestät", "@language": "de"}
  ]
}]
And the following context:
{
  "@context": {
    "vocab": "http://example.com/vocab/",
    "label": {
      "@id": "vocab:label",
      "@container": "@language"
    }
  }
}
The compacted version uses a map value for "label", with the keys representing the language tag and the values are the strings associated with the
relevant language tag.
Data can be indexed on a number of different keys, including @id, @type, @language, @index and more. See § 4.6 Indexed Values and § 4.9 Named
Graphs for more details.
This section is non-normative.
Sometimes it's useful to compact a document, but keep the node object and value object representations. For this, a term definition can set "@type":
"@none". This causes the Value Compaction algorithm to always use the object form of values, although components of that value may be compacted.
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
