---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-034-414-using-the-document-base-for-the-default-voca
section_title: "Using the Document Base for the Default Vocabulary"
section_number: 4.1.4
pages: 21-22
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 29: Using "#" as the vocabulary mapping
{
  "@context": {
If this document were located at http://example/document, it would expand as follows:
This section is non-normative.
A compact IRI is a way of expressing an IRI using a prefix and suffix separated by a colon (:). The prefix is a term taken from the active context and
is a short string identifying a particular IRI in a JSON-LD document. For example, the prefix foaf may be used as a shorthand for the Friend-of-a-
Friend vocabulary, which is identified using the IRI http://xmlns.com/foaf/0.1/. A developer may append any of the FOAF vocabulary terms to
the end of the prefix to specify a short-hand version of the IRI for the vocabulary term. For example, foaf:name would be expanded to the IRI
http://xmlns.com/foaf/0.1/name.
In the example above, foaf:name expands to the IRI http://xmlns.com/foaf/0.1/name and foaf:Person expands to
http://xmlns.com/foaf/0.1/Person.
Prefixes are expanded when the form of the value is a compact IRI represented as a prefix:suffix combination, the prefix matches a term defined
within the active context, and the suffix does not begin with two slashes (//). The compact IRI is expanded by concatenating the IRI mapped to the
prefix to the (possibly empty) suffix. If the prefix is not defined in the active context, or the suffix begins with two slashes (such as in
http://example.com), the value is interpreted as IRI instead. If the prefix is an underscore (_), the value is interpreted as blank node identifier
instead.
