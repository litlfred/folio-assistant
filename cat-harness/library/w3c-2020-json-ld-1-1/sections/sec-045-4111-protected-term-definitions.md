---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-045-4111-protected-term-definitions
section_title: "Protected Term Definitions"
section_number: 4.1.11
pages: 30-32
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
JSON-LD is used in many specifications as the specified data format. However, there is also a desire to allow some JSON-LD contents to be
processed as plain JSON, without using any of the JSON-LD algorithms. Because JSON-LD is very flexible, some terms from the original format
may be locally overridden through the use of embedded contexts, and take a different meaning for JSON-LD based implementations. On the other
hand, "plain JSON" implementations may not be able to interpret these embedded contexts, and hence will still interpret those terms with their
original meaning. To prevent this divergence of interpretation, JSON-LD 1.1 allows term definitions to be protected.
A protected term definition is a term definition with an entry @protected set to true. It generally prevents further contexts from overriding this term
definition, either through a new definition of the same term, or through clearing the context with "@context": null. Such attempts will raise an error
and abort the processing (except in some specific situations described below).
When all or most term definitions of a context need to be protected, it is possible to add an entry @protected set to true to the context itself. It has
the same effect as protecting each of its term definitions individually. Exceptions can be made by adding an entry @protected set to false in some
term definitions.
While protected terms can in general not be overridden, there are two exceptions to this rule. The first exception is that a context is allowed to
redefine a protected term if the new definition is identical to the protected term definition (modulo the @protected flag). The rationale is that the new
definition does not violate the protection, as it does not change the semantics of the protected term. This is useful for widespread term definitions,
such as aliasing @type to type, which may occur (including in a protected form) in several contexts.
Example 55: A protected term definition can generally not be overridden
{
  "@context": [
    {
      "@version": 1.1,
      "Person": "http://xmlns.com/foaf/0.1/Person",
      "knows": "http://xmlns.com/foaf/0.1/knows",
      "name": {
        "@id": "http://xmlns.com/foaf/0.1/name",
        "@protected": true
      }
    },
    {
      – this attempt will fail with an error
      "name": "http://schema.org/name"
    }
  ],
  "@type": "Person",
  "name": "Manu Sporny",
  "knows": {
    "@context": [
      – this attempt would also fail with an error
      null,
      "http://schema.org/"
    ],
    "name": "Gregg Kellogg"
  }
}
Input
Example 56: A protected @context with an exception
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": [
    {
      "@version": 1.1,
      "@protected": true,
      "name": "http://schema.org/name",
      "member": "http://schema.org/member",
      "Person": {
        "@id": "http://schema.org/Person",
        "@protected": false
      }
    }
  ],
  "name": "Digital Bazaar",
  "member": {
    "@context": {
      – name *is* protected, so the following would fail with an error
      –   "name": "http://xmlns.com/foaf/0.1/Person",
      – Person is *not* protected, and can be overridden 
      "Person": "http://xmlns.com/foaf/0.1/Person"
    },
    "@type": "Person",
    "name": "Manu Sporny"
  }
}
The second exception is that a property-scoped context is not affected by protection, and can therefore override protected terms, either with a new
term definition, or by clearing the context with "@context": null.
The rationale is that "plain JSON" implementations, relying on a given specification, will only traverse properties defined by that specification.
Scoped contexts belonging to the specified properties are part of the specification, so the "plain JSON" implementations are expected to be aware of
the change of semantics they induce. Scoped contexts belonging to other properties apply to parts of the document that "plain JSON"
implementations will ignore. In both cases, there is therefore no risk of diverging interpretations between JSON-LD-aware implementations and
"plain JSON" implementations, so overriding is permitted.
Example 57: Overriding permitted if both definitions are identical
Original 
Expanded 
Statements 
Turtle Open in playground
{
  "@context": [
    {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "Organization": "http://example.org/orga/Organization",
      "member": {
        "@id": "http://example.org/orga/member",
        "@type": "@id"
      }
    },
    {
      "id": "@id",
      "type": "@type",
      – Those "redefinitions" do not raise an error.
