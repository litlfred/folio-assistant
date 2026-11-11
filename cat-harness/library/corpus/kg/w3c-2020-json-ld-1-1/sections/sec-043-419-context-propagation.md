---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-043-419-context-propagation
section_title: "Context Propagation"
section_number: 4.1.9
pages: 28-29
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Note
Contexts included within an array must all have the same value for @propagate due to the way that rollback is defined in JSON-LD 1.1 Processing
Algorithms and API.
This section is non-normative.
JSON-LD 1.0 included mechanisms for modifying the context that is in effect. This included the capability to load and process a remote context and
then apply further changes to it via new contexts.
However, with the introduction of JSON-LD 1.1, it is also desirable to be able to load a remote context, in particular an existing JSON-LD 1.0
context, and apply JSON-LD 1.1 features to it prior to processing.
By using the @import keyword in a context, another remote context, referred to as an imported context, can be loaded and modified prior to
processing. The modifications are expressed in the context that includes the @import keyword, referred to as the wrapping context. Once an imported
context is loaded, the contents of the wrapping context are merged into it prior to processing. The merge operation will cause each key-value pair in
the wrapping context to be added to the loaded imported context, with the wrapping context key-value pairs taking precedence.
By enabling existing contexts to be reused and edited inline prior to processing, context-wide keywords can be applied to adjust all term definitions in
the imported context. Similarly, term definitions can be replaced prior to processing, enabling adjustments that, for instance, ensure term definitions
match previously protected terms or that they include additional type coercion information.
The following examples illustrate how @import can be used to express a type-scoped context that loads an imported context and sets @propagate to
true, as a technique for making other similar modifications.
Suppose there was a context that could be referenced remotely via the URL https://json-ld.org/contexts/remote-context.jsonld:
A wrapping context could be used to source it and modify it:
Input
Example 49: Marking a context to not propagate
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "term": {
      "@id": "http://example.org/original",
      "@context": {
        "@propagate": false,
         ↑ Scoped context only lasts in one node-object
        "term": "http://example.org/non-propagated-term"
      }
    }
  },
  "term": {
   ↑ This term is the original
    "term": {
     ↑ This term is from the scoped context
      "term": "This term is from the first context"
       ↑ This term is the original again
    }
  }
}
