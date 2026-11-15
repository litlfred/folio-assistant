---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-100-note
section_title: "Note"
section_number: null
pages: 71-71
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
This section describes features available with a documentLoader supporting HTML script extraction. See Remote Document and Context Retrieval
for more information.
JSON-LD content can be easily embedded in HTML [HTML] by placing it in a script element with the type attribute set to application/ld+json.
Doing so creates a data block.
Defining how such data may be used is beyond the scope of this specification. The embedded JSON-LD document might be extracted as is or, e.g., be
interpreted as RDF.
If JSON-LD content is extracted as RDF [RDF11-CONCEPTS], it MUST be expanded into an RDF Dataset using the Deserialize JSON-LD to RDF
Algorithm [JSON-LD11-API]. Unless a specific script is targeted (see § 7.3 Locating a Specific JSON-LD Script Element), all script elements with
type application/ld+json MUST be processed and merged into a single dataset with equivalent blank node identifiers contained in separate script
elements treated as if they were in a single document (i.e., blank nodes are shared between different JSON-LD script elements).
When processing a JSON-LD script element, the Document Base URL of the containing HTML document, as defined in [HTML], is used to establish
the default base IRI of the enclosed JSON-LD content.
7. Embedding JSON-LD in HTML Documents §
Input
Example 144: Embedding JSON-LD in HTML
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle
<script type="application/ld+json">
{
  "@context": "https://json-ld.org/contexts/person.jsonld",
  "@id": "http://dbpedia.org/resource/John_Lennon",
  "name": "John Lennon",
  "born": "1940-10-09",
  "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
}
</script>
Input
Example 145: Combining multiple JSON-LD script elements into a single dataset
HTML Embedded (Input) 
Statements 
Turtle (Result)
<p>Data describing Dave</p>
<script type="application/ld+json">
{
  "@context": "http://schema.org/",
  "@id": "https://digitalbazaar.com/author/dlongley/",
  "@type": "Person",
  "name": "Dave Longley"
}
</script>
<p>Data describing Gregg</p>
<script type="application/ld+json">
{
  "@context": "http://schema.org/",
  "@id": "https://greggkellogg.net/foaf#me",
  "@type": "Person",
  "name": "Gregg Kellogg"
}
</script>
