---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-030-serialization-information
section_title: "Serialization information"
section_number: null
pages: 20-20
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
A collection of elements may be serialized in multiple formats.
An SpdxDocument element represents a collection of elements across all serialization data formats within the model.
The actual serialized bytes is represented by an Artifact element within the model.
A Relationship of type serializedInArtifact links an SpdxDocument to one or more serialized forms of itself.
When serializing a physical SpdxDocument, any property of the logical element that can be natively represented within the chosen
serialization format (e.g., @context prefixes in JSON-LD instead of the namespaceMap) may utilize these native mechanisms.
All remaining properties shall be serialized within the SpdxDocument element itself.
A serialization must not contain more than one SpdxDocument.
A given instance of serialization must not define more than one SpdxDocument element.
6.5
