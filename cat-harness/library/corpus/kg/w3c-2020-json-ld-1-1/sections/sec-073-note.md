---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-073-note
section_title: "Note"
section_number: null
pages: 51-51
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Id maps are a new feature in JSON-LD 1.1.
This section is non-normative.
In addition to id and index maps, JSON-LD introduces the notion of type maps for structuring data. The type indexing feature allows an author to
structure data using a simple key-value map where the keys map to IRIs. This enables data to be structured based on the @type of specific node
objects. In JSON-LD such data can be specified by associating the @type keyword with a @container declaration in the context:
In the example above, the affiliation term has been marked as a type map. The schema:Corporation and schema:ProfessionalService keys
will be interpreted as the @type property of the node object value.
The value of @container can also be an array containing both @type and @set. When compacting, this ensures that a JSON-LD processor will use
the array form for all values of types.
      "words": 1539
    },
    "http://example.com/posts/1/de": {
      "body": "Die Werte an Warenbörsen stiegen im Sog eines starken Handels von Rohöl...",
      "words": 1204
    },
    "none": {
      "body": "Description for object without an @id",
      "words": 20
    }
  }
}
