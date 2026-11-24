---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-006-table-of-contents
section_title: "Table of Contents"
section_number: null
pages: 2-4
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
4. 4.4 Nested Properties
5. 4.5 Embedding
1. 4.5.1 Identifying Blank Nodes
6. 4.6 Indexed Values
1. 4.6.1 Data Indexing
1. 4.6.1.1 Property-based data indexing
2. 4.6.2 Language Indexing
3. 4.6.3 Node Identifier Indexing
4. 4.6.4 Node Type Indexing
7. 4.7 Included Nodes
8. 4.8 Reverse Properties
9. 4.9 Named Graphs
1. 4.9.1 Graph Containers
2. 4.9.2 Named Graph Data Indexing
3. 4.9.3 Named Graph Indexing
10. 4.10 Loading Documents
5. 5. Forms of JSON-LD
1. 5.1 Expanded Document Form
2. 5.2 Compacted Document Form
1. 5.2.1 Shortening IRIs
2. 5.2.2 Representing Values as Strings
3. 5.2.3 Representing Lists as Arrays
4. 5.2.4 Reversing Node Relationships
5. 5.2.5 Indexing Values
6. 5.2.6 Normalizing Values as Objects
7. 5.2.7 Representing Singular Values as Arrays
8. 5.2.8 Term Selection
3. 5.3 Flattened Document Form
4. 5.4 Framed Document Form
6. 6. Modifying Behavior with Link Relationships
1. 6.1 Interpreting JSON as JSON-LD
2. 6.2 Alternate Document Location
7. 7. Embedding JSON-LD in HTML Documents
1. 7.1 Inheriting base IRI from HTML's base element
2. 7.2 Restrictions for contents of JSON-LD script elements
3. 7.3 Locating a Specific JSON-LD Script Element
8. 8. Data Model
9. 9. JSON-LD Grammar
1. 9.1 Terms
2. 9.2 Node Objects
3. 9.3 Frame Objects
4. 9.4 Graph Objects
5. 9.5 Value Objects
6. 9.6 Value Patterns
7. 9.7 Lists and Sets
8. 9.8 Language Maps
9. 9.9 Index Maps
10. 9.10 Property-based Index Maps
11. 9.11 Id Maps
12. 9.12 Type Maps
13. 9.13 Included Blocks
14. 9.14 Property Nesting
15. 9.15 Context Definitions
1. 9.15.1 Expanded term definition
16. 9.16 Keywords
10. 10. Relationship to RDF
1. 10.1 Serializing/Deserializing RDF
2. 10.2 The rdf:JSON Datatype
3. 10.3 The i18n Namespace
4. 10.4 The rdf:CompoundLiteral class and the rdf:language and rdf:direction properties
11. 11. Security Considerations
12. 12. Privacy Considerations
13. 13. Internationalization Considerations
14. A. Image Descriptions
1. A.1 Linked Data Dataset
15. B. Relationship to Other Linked Data Formats
1. B.1 Turtle
1. B.1.1 Prefix definitions
2. B.1.2 Embedding
3. B.1.3 Conversion of native data types
4. B.1.4 Lists
2. B.2 RDFa
3. B.3 Microdata
16. C. IANA Considerations
1. C.1 Examples
17. D. Open Issues
18. E. Changes since 1.0 Recommendation of 16 January 2014
19. F. Changes since JSON-LD Community Group Final Report
20. G. Changes since Candidate Release of 12 December 2019
21. H. Changes since Proposed Recommendation Release of 7 May 2020
22. I. Acknowledgements
23. J. References
1. J.1 Normative references
2. J.2 Informative references
This section is non-normative.
Linked Data [LINKED-DATA] is a way to create a network of standards-based machine interpretable data across different documents and Web sites.
It allows an application to start at one piece of Linked Data, and follow embedded links to other pieces of Linked Data that are hosted on different
sites across the Web.
JSON-LD is a lightweight syntax to serialize Linked Data in JSON [RFC8259]. Its design allows existing JSON to be interpreted as Linked Data with
minimal changes. JSON-LD is primarily intended to be a way to use Linked Data in Web-based programming environments, to build interoperable
Web services, and to store Linked Data in JSON-based storage engines. Since JSON-LD is 100% compatible with JSON, the large number of JSON
parsers and libraries available today can be reused. In addition to all the features JSON provides, JSON-LD introduces:
a universal identifier mechanism for JSON objects via the use of IRIs,
a way to disambiguate keys shared among different JSON documents by mapping them to IRIs via a context,
a mechanism in which a value in a JSON object may refer to a resource on a different site on the Web,
the ability to annotate strings with their language,
a way to associate datatypes with values such as dates and times,
and a facility to express one or more directed graphs, such as a social network, in a single document.
JSON-LD is designed to be usable directly as JSON, with no knowledge of RDF [RDF11-CONCEPTS]. It is also designed to be usable as RDF in
conjunction with other Linked Data technologies like SPARQL [SPARQL11-OVERVIEW]. Developers who require any of the facilities listed above
or need to serialize an RDF graph or Dataset in a JSON-based syntax will find JSON-LD of interest. People intending to use JSON-LD with RDF
tools will find it can be used as another RDF syntax, as with [Turtle] and [TriG]. Complete details of how JSON-LD relates to RDF are in section
§ 10. Relationship to RDF.
The syntax is designed to not disturb already deployed systems running on JSON, but provide a smooth upgrade path from JSON to JSON-LD. Since
the shape of such data varies wildly, JSON-LD features mechanisms to reshape documents into a deterministic structure which simplifies their
processing.
This section is non-normative.
This document is a detailed specification for a serialization of Linked Data in JSON. The document is primarily intended for the following audiences:
Software developers who want to encode Linked Data in a variety of programming languages that can use JSON
Software developers who want to convert existing JSON to JSON-LD
Software developers who want to understand the design decisions and language syntax for JSON-LD
Software developers who want to implement processors and APIs for JSON-LD
Software developers who want to generate or consume Linked Data, an RDF graph, or an RDF Dataset in a JSON syntax
A companion document, the JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API], specifies how to work with JSON-LD at
a higher level by providing a standard library interface for common JSON-LD operations.
To understand the basics in this specification you must first be familiar with JSON, which is detailed in [RFC8259].
This document almost exclusively uses the term IRI (Internationalized Resource Indicator) when discussing hyperlinks. Many Web developers are
more familiar with the URL (Uniform Resource Locator) terminology. The document also uses, albeit rarely, the URI (Uniform Resource Indicator)
terminology. While these terms are often used interchangeably among technical communities, they do have important distinctions from one another
