---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-123-915-context-definitions
section_title: "Context Definitions"
section_number: 9.15
pages: 78-79
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
A context definition MUST be a map whose keys MUST be either terms, compact IRIs, IRIs, or one of the keywords @base, @import, @language,
@propagate, @protected, @type, @version, or @vocab.
If the context definition has an @base key, its value MUST be an IRI reference, or null.
If the context definition has an @direction key, its value MUST be one of "ltr" or "rtl", or be null.
If the context definition contains the @import keyword, its value MUST be an IRI reference. When used as a reference from an @import, the
referenced context definition MUST NOT include an @import key, itself.
If the context definition has an @language key, its value MUST have the lexical form described in [BCP47] or be null.
If the context definition has an @propagate key, its value MUST be true or false.
If the context definition has an @protected key, its value MUST be true or false.
If the context definition has an @type key, its value MUST be a map with only the entry @container set to @set, and optionally an entry @protected.
If the context definition has an @version key, its value MUST be a number with the value 1.1.
If the context definition has an @vocab key, its value MUST be an IRI reference, a compact IRI, a blank node identifier, a term, or null.
The value of keys that are not keywords MUST be either an IRI, a compact IRI, a term, a blank node identifier, a keyword, null, or an expanded term
definition.
An expanded term definition is used to describe the mapping between a term and its expanded identifier, as well as other properties of the value
associated with the term when it is used as key in a node object.
An expanded term definition MUST be a map composed of zero or more keys from @id, @reverse, @type, @language, @container, @context,
