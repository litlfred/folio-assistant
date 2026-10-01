---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-047-note
section_title: "Note"
section_number: null
pages: 33-33
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
By preventing terms from being overridden, protection also prevents any adaptation of a term (e.g., defining a more precise datatype, restricting the
term's use to lists, etc.). This kind of adaptation is frequent with some general purpose contexts, for which protection would therefore hinder their
usability. As a consequence, context publishers should use this feature with care.
Note
Protected term definitions are a new feature in JSON-LD 1.1.
This section is non-normative.
Values are leaf nodes in a graph associated with scalar values such as strings, dates, times, and other such atomic values.
This section is non-normative.
A value with an associated type, also known as a typed value, is indicated by associating a value with an IRI which indicates the value's type. Typed
values may be expressed in JSON-LD in three ways:
1. By utilizing the @type keyword when defining a term within an @context section.
2. By utilizing a value object.
3. By using a native JSON type such as number, true, or false.
The first example uses the @type keyword to associate a type with a particular term in the @context:
The modified key's value above is automatically interpreted as a dateTime value because of the information specified in the @context. The example
tabs show how a JSON-LD processor will interpret the data.
The second example uses the expanded form of setting the type information in the body of a JSON-LD document:
    "location": {"name": "Blacksburg, Virginia"}
  }
}
