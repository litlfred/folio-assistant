---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-133-11-security-considerations
section_title: "Security Considerations"
section_number: 11
pages: 85-85
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Note
Future versions of this specification may incorporate subresource integrity [SRI] as a means of ensuring that cached and retrieved content matches
data retrieved from remote servers; see issue 86.
The retrieval of external contexts can expose the operation of a JSON-LD processor, allow intermediate nodes to fingerprint the client application
through introspection of retrieved resources (see [fingerprinting-guidance]), and provide an opportunity for a man-in-the-middle attack. To protect
against this, publishers should consider caching remote contexts for future use, or use the documentLoader to maintain a local version of such
contexts.
As JSON-LD uses the RDF data model, it is restricted by design in its ability to properly record JSON-LD Values which are strings with left-to-right
or right-to-left direction indicators. Both JSON-LD and RDF provide a mechanism for specifying the language associated with a string (language-
tagged string), but do not provide a means of indicating the base direction of the string.
Unicode provides a mechanism for signaling direction within a string (see Unicode Bidirectional Algorithm [UAX9]), however, when a string has an
overall base direction which cannot be determined by the beginning of the string, an external indicator is required, such as the [HTML] dir attribute,
which currently has no counterpart for RDF literals.
The issue of properly representing base direction in RDF is not something that this Working Group can handle, as it is a limitation or the core RDF
data model. This Working Group expects that a future RDF Working Group will consider the matter and add the ability to specify the base direction
of language-tagged strings.
Until a more comprehensive solution can be addressed in a future version of this specification, publishers should consider this issue when
representing strings where the base direction of the string cannot otherwise be correctly inferred based on the content of the string. See [string-meta]
for a discussion best practices for identifying language and base direction for strings used on the Web.
This section is non-normative.
This section is non-normative.
This section describes the Linked Data Dataset figure in § 8. Data Model.
The image consists of three dashed boxes, each describing a different linked data graph. Each box consists of shapes linked with arrows describing
the linked data relationships.
The first box is titled "default graph: <no name>" describes two resources: http://example.com/people/alice and
http://example.com/people/bob (denoting "Alice" and "Bob" respectively), which are connected by an arrow labeled schema:knows which
describes the knows relationship between the two resources. Additionally, the "Alice" resource is related to three different literals:
11. Security Considerations §
