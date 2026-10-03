---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-058-note
section_title: "Note"
section_number: null
pages: 40-40
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Base direction associations are only applied to plain strings and language-tagged strings. Typed values or values that are subject to type coercion are
not given a base direction.
Third, it is possible to override the default base direction by using a value object:
See Strings on the Web: Language and Direction Metadata [string-meta] for a deeper discussion of base direction.
This section is non-normative.
A JSON-LD author can express multiple values in a compact way by using arrays. Since graphs do not describe ordering for links between nodes,
arrays in JSON-LD do not convey any ordering of the contained elements by default. This is exactly the opposite from regular JSON arrays, which
are ordered by default. For example, consider the following simple document:
Multiple values may also be expressed using the expanded form:
Note
The example shown above would generates statement, again with no inherent order.
Although multiple values of a property are typically of the same type, JSON-LD places no restriction on this, and a property may have values of
different types:
Example 77: Overriding default language and default base direction using an expanded value
{
  "@context": {
    ...
    "@language": "ar-EG",
    "@direction": "rtl"
  },
  "title": "HTML و CSS: تصميم و إنشاء مواقع الويب",
  "author": {
    "@value": "Jon Duckett",
    "@language": "en",
    "@direction": null
  }
}
