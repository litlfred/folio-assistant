---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-042-note
section_title: "Note"
section_number: null
pages: 28-28
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
If a term defines a scoped context, and then that term is later redefined, the association of the context defined in the earlier expanded term definition
is lost within the scope of that redefinition. This is consistent with term definitions of a term overriding previous term definitions from earlier less
deeply nested definitions, as discussed in § 4.1 Advanced Context Usage.
Note
Scoped Contexts are a new feature in JSON-LD 1.1.
This section is non-normative.
Once introduced, contexts remain in effect until a subsequent context removes it by setting @context to null, or by redefining terms, with the
exception of type-scoped contexts, which limit the effect of that context until the next node object is entered. This behavior can be changed using the
@propagate keyword.
The following example illustrates how terms defined in a context with @propagate set to false are effectively removed when descending into new
node object.
    },
    "Type2": {
      "@id": "http://example.com/vocab/Type2",
      "@context": {
        "term4": "http://example.com/vocab/term4"
         ↑ Scoped context for "Type2" defines term4
      }
    }
  },
  "property": {
    "@context": {
      "term2": "http://example.com/vocab/term2"
         ↑ Embedded context defines term2
    },
    "@type": ["Type2", "Type1"],
    "term1": "a",
    "term2": "b",
    "term3": "c",
    "term4": "d"
  }
}
Example 48: Expansion using embedded and scoped contexts (embedding equivalent)
{
  "@context": {
    "@vocab": "http://example.com/vocab/",
    "property": "http://example.com/vocab/property",
    "Type1": "http://example.com/vocab/Type1",
    "Type2": "http://example.com/vocab/Type2"
  },
  "property": {
    "@context": [{
        "term1": "http://example.com/vocab/term1"
         ↑ Previously scoped context for "property" defines term1
      }, {
        "term2": "http://example.com/vocab/term2"
         ↑ Embedded context defines term2
      }, {
        "term3": "http://example.com/vocab/term3"
         ↑ Previously scoped context for "Type1" defines term3
      }, {
      "term4": "http://example.com/vocab/term4"
         ↑ Previously scoped context for "Type2" defines term4
    }],
    "@type": ["Type2", "Type1"],
    "term1": "a",
    "term2": "b",
    "term3": "c",
    "term4": "d"
  }
}
