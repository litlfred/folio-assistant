---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-061-spdxdocument
section_title: "SpdxDocument"
section_number: null
pages: 38-39
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A collection of SPDX Elements that could potentially be serialized.
26
System Package Data Exchange (SPDX©) v3.0
Description
The SpdxDocument provides a convenient way to express information about collections of SPDX Elements that could potentially
be serialized as complete units (e.g., all in-scope SPDX data within a single JSON-LD file).
SpdxDocument is independent of any particular serialization format or instance.
Information we wish to preserve about a specific instance of serialization of this SPDX content is NOT expressed using the
SpdxDocument but rather using an associated Artifact representing a particular instance of SPDX data physical serialization.
Any instance of serialization of SPDX data MUST NOT contain more than one SpdxDocument element definition.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/SpdxDocument
Name:
SpdxDocument
Instantiability:
Concrete
SubclassOf:
ElementCollection
Superclasses
• /Core/ElementCollection
• /Core/Element
