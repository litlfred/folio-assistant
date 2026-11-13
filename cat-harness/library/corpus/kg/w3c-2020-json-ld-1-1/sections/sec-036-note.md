---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-036-note
section_title: "Note"
section_number: null
pages: 23-24
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The term selection behavior for 1.0 processors was changed as a result of an errata against JSON-LD 1.0 reported here. This does not affect the
behavior of processing existing JSON-LD documents, but creates a slight change when compacting documents using Compact IRIs.
The behavior when compacting can be illustrated by considering the following input document in expanded form:
Using the following context in the 1.0 processing mode will now select the term vocab rather than property, even though the IRI associated with
property captures more of the original IRI.
Compacting using the previous context with the above expanded input document results in the following compacted result:
In the original [JSON-LD10], the term selection algorithm would have selected property, creating the Compact IRI property:One. The original
behavior can be made explicit using @prefix:
  "picture": "http://twitter.com/account/profile_image/markuslanthaler"
}
Input
Example 33: Expanded document used to illustrate compact IRI creation
[{
  "http://example.com/vocab/property": [{"@value": "property"}],
  "http://example.com/vocab/propertyOne": [{"@value": "propertyOne"}]
}]
Context
Example 34: Compact IRI generation context (1.0)
{
  "@context": {
    "vocab": "http://example.com/vocab/",
    "property": "http://example.com/vocab/property"
  }
}
Result
Example 35: Compact IRI generation term selection (1.0)
Compacted (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "vocab": "http://example.com/vocab/",
    "property": "http://example.com/vocab/property"
  },
  "property": "property",
  "vocab:propertyOne": "propertyOne"
}
Context
Example 36: Compact IRI generation context (1.1)
{
  "@context": {
    "@version": 1.1,
    "vocab": "http://example.com/vocab/",
    "property": {
      "@id": "http://example.com/vocab/property",
      "@prefix": true
    }
  }
}
Example 37: Compact IRI generation term selection (1.1)
In this case, the property term would not normally be usable as a prefix, both because it is defined with an expanded term definition, and because its
@id does not end in a gen-delim character. Adding "@prefix": true allows it to be used as the prefix portion of the compact IRI property:One.
This section is non-normative.
Each of the JSON-LD keywords, except for @context, may be aliased to application-specific keywords. This feature allows legacy JSON content to
be utilized by JSON-LD by re-using JSON keys that already exist in legacy documents. This feature also allows developers to design domain-specific
implementations using only the JSON-LD context.
In the example above, the @id and @type keywords have been given the aliases url and a, respectively.
Other than for @type, properties of expanded term definitions where the term is a keyword result in an error. Unless the processing mode is set to
json-ld-1.0, there is also an exception for @type; see § 4.3.3 Using @set with @type for further details and usage examples.
Unless the processing mode is set to json-ld-1.0, aliases of keywords are either simple term definitions, where the value is a keyword, or a
expanded term definitions with an @id entry and optionally an @protected entry; no other entries are allowed. There is also an exception for aliases
of @type, as indicated above. See § 4.1.11 Protected Term Definitions for further details of using @protected.
Since keywords cannot be redefined, they can also not be aliased to other keywords.
Note
Aliased keywords may not be used within a context, itself.
See § 9.16 Keywords for a normative definition of all keywords.
This section is non-normative.
In general, normal IRI expansion rules apply anywhere an IRI is expected (see § 3.2 IRIs). Within a context definition, this can mean that terms
defined within the context may also be used within that context as long as there are no circular dependencies. For example, it is common to use the
xsd namespace when defining typed values:
Input
Compacted (Input) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "vocab": "http://example.com/vocab/",
    "property": {
      "@id": "http://example.com/vocab/property",
      "@prefix": true
    }
  },
  "property": "property",
  "property:One": "propertyOne"
}
