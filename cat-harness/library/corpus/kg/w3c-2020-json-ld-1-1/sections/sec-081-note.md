---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-081-note
section_title: "Note"
section_number: null
pages: 59-59
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Graph Containers are a new feature in JSON-LD 1.1.
This section is non-normative.
The JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API] defines the interface to a JSON-LD Processor and includes a
number of methods used for manipulating different forms of JSON-LD (see § 5. Forms of JSON-LD). This includes a general mechanism for loading
remote documents, including referenced JSON-LD documents and remote contexts, and potentially extracting embedded JSON-LD from other
formats such as [HTML]. This is more fully described in Remote Document and Context Retrieval in [JSON-LD11-API].
A documentLoader can be useful in a number of contexts where loading remote documents can be problematic:
Remote context documents should be cached to prevent overloading the location of the remote context for each request. Normally, an HTTP
caching infrastructure might be expected to handle this, but in some contexts this might not be feasible. A documentLoader implementation
might provide separate logic for performing such caching.
Non-standard URL schemes may not be widely implemented, or may have behavior specific to a given application domain. A documentLoader
can be defined to implement document retrieval semantics.
Certain well-known contexts may be statically cached within a documentLoader implementation. This might be particularly useful in
embedded applications, where it is not feasible, or even possible, to access remote documents.
For security purposes, the act of remotely retrieving a document may provide a signal of application behavior. The judicious use of a
documentLoader can isolate the application and reduce its online fingerprint.
This section is non-normative.
As with many data formats, there is no single correct way to describe data in JSON-LD. However, as JSON-LD is used for describing graphs, certain
transformations can be used to change the shape of the data, without changing its meaning as Linked Data.
