---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-033-json-ld-validation
section_title: "JSON-LD validation"
section_number: null
pages: 20-21
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
An SPDX serialization in JSON-LD format is considered conformant to the SPDX specification if it adheres to the following two
validation criteria:
• Structural validation: The JSON-LD document must structurally validate against the SPDX JSON Schema. This schema
defines the expected structure of the JSON-LD document, including the required elements, data types, and permissible
values.
• Semantic validation: The JSON-LD document must successfully validate against the SPDX OWL ontology. This ontology
defines the expected relationships and constraints between SPDX elements. The SPDX OWL ontology also incorporates
SHACL shape restrictions to further specify these constraints.
The SPDX JSON Schema is available at: https://spdx.org/schema/3.0.1/spdx-json-schema.json
The SPDX OWL ontology is available at: https://spdx.org/rdf/3.0.1/spdx-model.ttl
8
System Package Data Exchange (SPDX©) v3.0
7
