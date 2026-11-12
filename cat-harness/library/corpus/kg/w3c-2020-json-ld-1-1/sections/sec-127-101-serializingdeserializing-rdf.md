---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-127-101-serializingdeserializing-rdf
section_title: "Serializing/Deserializing RDF"
section_number: 10.1
pages: 82-83
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Running the JSON-LD Expansion and Flattening algorithms against the JSON-LD input document in the example above would result in the
following output:
Deserializing this to RDF now is a straightforward process of turning each node object into one or more triples. This can be expressed in Turtle as
follows:
The process of serializing RDF as JSON-LD can be thought of as the inverse of this last step, creating an expanded JSON-LD document closely
matching the triples from RDF, using a single node object for all triples having a common subject, and a single property for those triples also having a
common predicate. The result may then be framed by using the Framing Algorithm described in [JSON-LD11-FRAMING] to create the desired
object embedding.
RDF provides for JSON content as a possible literal value. This allows markup in literal values. Such content is indicated in a graph using a literal
whose datatype is set to rdf:JSON.
