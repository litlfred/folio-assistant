---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-028-rdf-serialization
section_title: "RDF serialization"
section_number: null
pages: 19-19
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Since the data model is based on RDF, any SPDX data can be serialized in any of the multiple RDF serialization formats, including
but not limited to:
• JSON-LD format as defined in JSON-LD 1.1;
• Turtle (Terse RDF Triple Language) format as defined in RDF 1.1 Turtle;
• N-Triples format as defined in RDF 1.1 N-Triples; and
• RDF/XML format as defined in RDF 1.1 XML Syntax.
The SPDX specification is accompanied by a JSON-LD context definition file that can be used to serialize SPDX in a much simpler
and more human-readable JSON-LD format.
6.3
