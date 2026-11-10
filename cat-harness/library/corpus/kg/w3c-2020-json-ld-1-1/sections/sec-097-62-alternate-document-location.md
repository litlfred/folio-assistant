---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-097-62-alternate-document-location
section_title: "Alternate Document Location"
section_number: 6.2
pages: 69-69
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Ordinary JSON documents can be interpreted as JSON-LD by providing an explicit JSON-LD context document. One way to provide this is by using
referencing a JSON-LD context document in an HTTP Link Header. Doing so allows JSON to be unambiguously machine-readable without requiring
developers to drastically change their documents and provides an upgrade path for existing infrastructure without breaking existing clients that rely
on the application/json media type or a media type with a +json suffix as defined in [RFC6839].
In order to use an external context with an ordinary JSON document, when retrieving an ordinary JSON document via HTTP, processors MUST
attempt to retrieve any JSON-LD document referenced by a Link Header with:
rel="http://www.w3.org/ns/json-ld#context", and
type="application/ld+json".
The referenced document MUST have a top-level JSON object. The @context entry within that object is added to the top-level JSON object of the
referencing document. If an array is at the top-level of the referencing document and its items are JSON objects, the @context subtree is added to all
array items. All extra information located outside of the @context subtree in the referenced document MUST be discarded. Effectively this means that
    "creator": "Plato",
    "title": "The Republic",
    "contains": "http://example.org/library/the-republic#introduction"
  }, {
    "@id": "http://example.org/library/the-republic#introduction",
    "@type": "Chapter",
    "description": "An introductory chapter on The Republic.",
    "title": "The Introduction"
  }]
}
Example 141: Framed library objects
Open in playground
{
  "@context": {
    "@version": 1.1,
    "@vocab": "http://example.org/"
  },
  "@id": "http://example.org/library",
  "@type": "Library",
  "contains": {
    "@id": "http://example.org/library/the-republic",
    "@type": "Book",
    "contains": {
      "@id": "http://example.org/library/the-republic#introduction",
      "@type": "Chapter",
      "description": "An introductory chapter on The Republic.",
      "title": "The Introduction"
    },
    "creator": "Plato",
    "title": "The Republic"
  }
}
