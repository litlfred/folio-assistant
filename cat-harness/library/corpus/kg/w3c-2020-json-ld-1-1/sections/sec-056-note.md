---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-056-note
section_title: "Note"
section_number: null
pages: 37-37
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Keys in the context are treated as terms for the purpose of expansion and value coercion. At times, this may result in multiple representations for the
same expanded IRI. For example, one could specify that dog and cat both expanded to http://example.com/vocab#animal. Doing this could be
useful for establishing different type coercion or language specification rules.
This section is non-normative.
At times, it is important to annotate a string with its language. In JSON-LD this is possible in a variety of ways. First, it is possible to define a default
language for a JSON-LD document by setting the @language key in the context:
The example above would associate the ja language tag with the two strings 花澄 and 科学者 Languages tags are defined in [BCP47]. The default
language applies to all string values that are not type coerced.
To clear the default language for a subtree, @language can be set to null in an intervening context, such as a scoped context as follows:
Second, it is possible to associate a language with a specific term using an expanded term definition:
