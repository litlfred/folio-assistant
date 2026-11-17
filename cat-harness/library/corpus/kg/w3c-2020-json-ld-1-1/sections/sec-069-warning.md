---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-069-warning
section_title: "Warning"
section_number: null
pages: 47-48
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
As data indexes are not preserved when round-tripping to RDF; this feature should be used judiciously. Often, other indexing mechanisms, which
are preserved, are more appropriate.
The value of @container can also be an array containing both @index and @set. When compacting, this ensures that a JSON-LD Processor will use
the array form for all values of indexes.
Unless the processing mode is set to json-ld-1.0, the special index @none is used for indexing data which does not have an associated index, which
is useful to maintain a normalized representation.
    },
    "position": "schema:jobTitle"
  },
  "@id": "http://example.com/",
  "@type": "schema:SportsTeam",
  "name": "San Francisco Giants",
  "athletes": {
    "catcher": {
      "@type": "schema:Person",
      "name": "Buster Posey",
      "position": "Catcher"
    },
    "pitcher": {
      "@type": "schema:Person",
      "name": "Madison Bumgarner",
      "position": "Starting Pitcher"
    },
    ....
  }
}
Input
Example 98: Indexing data using @none
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
     "@version": 1.1,
    "schema": "http://schema.org/",
    "name": "schema:name",
    "body": "schema:articleBody",
    "athletes": {
      "@id": "schema:athlete",
      "@container": "@index"
    },
    "position": "schema:jobTitle"
  },
  "@id": "http://example.com/",
  "@type": "schema:SportsTeam",
  "name": "San Francisco Giants",
  "athletes": {
    "catcher": {
      "@type": "schema:Person",
      "name": "Buster Posey",
      "position": "Catcher"
    },
    "pitcher": {
      "@type": "schema:Person",
      "name": "Madison Bumgarner",
      "position": "Starting Pitcher"
    },
    "@none": {
      "name": "Lou Seal",
      "position": "Mascot"
    },
    ....
  }
}
This section is non-normative.
In its simplest form (as in the examples above), data indexing assigns no semantics to the keys of an index map. However, in some situations, the
keys used to index objects are semantically linked to these objects, and should be preserved not only syntactically, but also semantically.
Unless the processing mode is set to json-ld-1.0, "@container": "@index" in a term description can be accompanied with an "@index" key. The
value of that key must map to an IRI, which identifies the semantic property linking each object to its key.
