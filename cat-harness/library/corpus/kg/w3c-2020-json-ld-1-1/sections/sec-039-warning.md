---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-039-warning
section_title: "Warning"
section_number: null
pages: 25-26
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
If a compact IRI is used as a term, it must expand to the value that compact IRI would have on its own when expanded. This represents a change
to the original 1.0 algorithm to prevent terms from expanding to a different IRI, which could lead to undesired results.
      "@type": "xsd:integer"
    },
    "homepage": {
      "@id": "http://xmlns.com/foaf/0.1/homepage",
      "@type": "@id"
    }
  },
  ...
}
Example 40: Using a term to define the IRI of another term within a context
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "name": "foaf:name",
    "age": {
      "@id": "foaf:age",
      "@type": "xsd:integer"
    },
    "homepage": {
      "@id": "foaf:homepage",
      "@type": "@id"
    }
  },
  ...
}
Example 41: Using a compact IRI as a term
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "name": "foaf:name",
    "foaf:age": {
      "@id": "http://xmlns.com/foaf/0.1/age",
      "@type": "xsd:integer"
    },
    "foaf:homepage": {
      "@type": "@id"
    }
  },
  ...
}
Example 42: Illegal Aliasing of a compact IRI to a different IRI
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "name": "foaf:name",
    "foaf:age": {
      "@id": "http://xmlns.com/foaf/0.1/age",
      "@type": "xsd:integer"
    },
    "foaf:homepage": {
     "@id": "http://schema.org/url",
⚠
IRIs may also be used in the key position in a context:
In order for the IRI to match above, the IRI needs to be used in the JSON-LD document. Also note that foaf:homepage will not use the { "@type":
"@id" } declaration because foaf:homepage is not the same as http://xmlns.com/foaf/0.1/homepage. That is, terms are looked up in a context
using direct string comparison before the prefix lookup mechanism is applied.
Warning
Neither an IRI reference nor a compact IRI may expand to some other unrelated IRI. This represents a change to the original 1.0 algorithm which
allowed this behavior but discouraged it.
The only other exception for using terms in the context is that circular definitions are not allowed. That is, a definition of term1 cannot depend on the
definition of term2 if term2 also depends on term1. For example, the following context definition is illegal:
This section is non-normative.
An expanded term definition can include a @context property, which defines a context (a scoped context) for values of properties defined using that
term. When used for a property, this is called a property-scoped context. This allows values to use term definitions, the base IRI, vocabulary
mappings or the default language which are different from the node object they are contained in, as if the context was specified within the value itself.
     "@type": "@id"
    }
  },
  ...
}
Example 43: Associating context definitions with IRIs
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "name": "foaf:name",
    "foaf:age": {
      "@id": "http://xmlns.com/foaf/0.1/age",
      "@type": "xsd:integer"
    },
    "http://xmlns.com/foaf/0.1/homepage": {
      "@type": "@id"
    }
  },
  ...
}
Example 44: Illegal circular definition of terms within a context
{
  "@context": {
    "term1": "term2:foo",
    "term2": "term1:bar"
  },
  ...
}
