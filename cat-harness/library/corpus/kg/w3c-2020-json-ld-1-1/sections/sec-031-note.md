---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-031-note
section_title: "Note"
section_number: null
pages: 20-20
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Setting the processing mode explicitly to json-ld-1.1 is RECOMMENDED to prevent a JSON-LD 1.0 processor from incorrectly processing a
JSON-LD 1.1 document and producing different results.
This section is non-normative.
At times, all properties and types may come from the same vocabulary. JSON-LD's @vocab keyword allows an author to set a common prefix which
is used as the vocabulary mapping and is used for all properties and types that do not match a term and are neither an IRI nor a compact IRI (i.e., they
do not contain a colon).
If @vocab is used but certain keys in an map should not be expanded using the vocabulary IRI, a term can be explicitly set to null in the context. For
instance, in the example below the databaseId entry would not expand to an IRI causing the property to be dropped when expanding.
Since JSON-LD 1.1, the vocabulary mapping in a local context can be set to a relative IRI reference, which is concatenated to any vocabulary
mapping in the active context (see § 4.1.4 Using the Document Base for the Default Vocabulary for how this applies if there is no vocabulary
mapping in the active context).
The following example illustrates the affect of expanding a property using a relative IRI reference, which is shown in the Expanded (Result) tab
below.
Example 23: Setting @version in context
{
  "@context": {
    "@version": 1.1,
    ...
  },
  ...
}
