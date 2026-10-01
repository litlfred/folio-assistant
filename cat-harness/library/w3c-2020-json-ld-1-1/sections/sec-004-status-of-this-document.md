---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-004-status-of-this-document
section_title: "Status of This Document"
section_number: null
pages: 1-2
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
There is a live JSON-LD playground that is capable of demonstrating the features described in this document.
This specification is intended to supersede the JSON-LD 1.0 [JSON-LD10] specification.
This document was published by the JSON-LD Working Group as a Recommendation.
GitHub Issues are preferred for discussion of this specification. Alternatively, you can send comments to our mailing list. Please send them to public-
json-ld-wg@w3.org (archives).
Please see the Working Group's implementation report.
This document has been reviewed by W3C Members, by software developers, and by other W3C groups and interested parties, and is endorsed by the
Director as a W3C Recommendation. It is a stable document and may be used as reference material or cited from another document. W3C's role in
making the Recommendation is to draw attention to the specification and to promote its widespread deployment. This enhances the functionality and
interoperability of the Web.
This document was produced by a group operating under the W3C Patent Policy. W3C maintains a public list of any patent disclosures made in
connection with the deliverables of the group; that page also includes instructions for disclosing a patent. An individual who has actual knowledge of
a patent which the individual believes contains Essential Claim(s) must disclose the information in accordance with section 6 of the W3C Patent
Policy.
This document is governed by the 1 March 2019 W3C Process Document.
This document is one of three JSON-LD 1.1 Recommendations produced by the JSON-LD Working Group:
JSON-LD 1.1
JSON-LD 1.1 Processing Algorithms and API
JSON-LD 1.1 Framing
1. 1. Introduction
1. 1.1 How to Read this Document
2. 1.2 Contributing
3. 1.3 Typographical conventions
4. 1.4 Terminology
5. 1.5 Design Goals and Rationale
6. 1.6 Data Model Overview
7. 1.7 Syntax Tokens and Keywords
2. 2. Conformance
3. 3. Basic Concepts
1. 3.1 The Context
2. 3.2 IRIs
3. 3.3 Node Identifiers
4. 3.4 Uses of JSON Objects
5. 3.5 Specifying the Type
4. 4. Advanced Concepts
1. 4.1 Advanced Context Usage
1. 4.1.1 JSON-LD 1.1 Processing Mode
2. 4.1.2 Default Vocabulary
3. 4.1.3 Base IRI
4. 4.1.4 Using the Document Base for the Default Vocabulary
5. 4.1.5 Compact IRIs
6. 4.1.6 Aliasing Keywords
7. 4.1.7 IRI Expansion within a Context
8. 4.1.8 Scoped Contexts
9. 4.1.9 Context Propagation
10. 4.1.10 Imported Contexts
11. 4.1.11 Protected Term Definitions
2. 4.2 Describing Values
1. 4.2.1 Typed Values
2. 4.2.2 JSON Literals
3. 4.2.3 Type Coercion
4. 4.2.4 String Internationalization
1. 4.2.4.1 Base Direction
3. 4.3 Value Ordering
1. 4.3.1 Lists
2. 4.3.2 Sets
3. 4.3.3 Using @set with @type
