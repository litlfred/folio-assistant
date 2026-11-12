---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-098-6-modifying-behavior-with-link-relationships
section_title: "Modifying Behavior with Link Relationships"
section_number: 6
pages: 69-70
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
6.1 Interpreting JSON as JSON-LD §
the active context is initialized with the referenced external context. A response MUST NOT contain more than one HTTP Link Header using the
http://www.w3.org/ns/json-ld#context link relation.
Other mechanisms for providing a JSON-LD Context MAY be described for other URI schemes.
The JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API] provides for an expandContext option for specifying a context to
use when expanding JSON documents programmatically.
The following example demonstrates the use of an external context with an ordinary JSON document over HTTP:
Please note that JSON-LD documents served with the application/ld+json media type MUST have all context information, including references to
external contexts, within the body of the document. Contexts linked via a http://www.w3.org/ns/json-ld#context HTTP Link Header MUST be
ignored for such documents.
Documents which can't be directly interpreted as JSON-LD can provide an alternate location containing JSON-LD. One way to provide this is by
referencing a JSON-LD document in an HTTP Link Header. This might be useful, for example, when the URL associated with a namespace naturally
contains an HTML document, but the JSON-LD context associated with that URL is located elsewhere.
To specify an alternate location, a non-JSON resource (i.e., one using a media type other than application/json or a derivative) can return the
alternate location using a Link Header with:
rel="alternate", and
type="application/ld+json".
A response MUST NOT contain more than one HTTP Link Header using the alternate link relation with type="application/ld+json" .
Other mechanisms for providing an alternate location MAY be described for other URI schemes.
The following example demonstrates the use of an alternate location with an ordinary HTTP document over HTTP:
