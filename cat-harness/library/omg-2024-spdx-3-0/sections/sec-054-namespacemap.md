---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-054-namespacemap
section_title: "NamespaceMap"
section_number: null
pages: 33-34
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A mapping between prefixes and namespace partial URIs.
Description
A namespace map allows the creator of a collection of serializable Elements to suggest shorter identifiers (“prefixes”) for specific
namespace portions of Element IDs. This map is used in SPDX content serialization to provide a more human-readable and smaller
serialized representation of the Elements.
For details of how NamespaceMap content is to be serialized please refer to the Model and serializations1 clause and the various
serialization format-specific files within the spdx-3-model repository2.
Namespace maps support a variety of relevant use cases such as:
1. An SPDX content producer wishing to provide clarity of their serialization of an SPDX 2.X simple style collection where
all content is newly minted and a single prefix-namespace is used. The consumer of SPDX content wishes to preserve the
name space mapping provided by such a producer.
In this case, the consumer would record the namespace map prefixes in the NamespaceMap such that subsequent serializa-
tions could reproduce the prefixes / namespaces in the native serialization format.
1../../../serializations.md
2https://github.com/spdx/spdx-3-model/tree/main/serialization
System Package Data Exchange (SPDX©) v3.0
21
2. An SPDX content producer wishing to maintain consistent prefix use and understanding across multiple different serialization
formats of the produced content.
For example, an SBOM producer wishes to share/publish the SBOM as JSON-LD and XML. The producer can specify the
preferred prefix mappings in the native serialization format using information from a single NamespaceMap accessible local
to the producer.
3. An SPDX content consumer/producer wishing to maintain consistent prefix use while round tripping from SPDX content
received, deserialized, modified/extended in some way, and then reserialized in the same serialization form.
In this case the prefix-namespace mappings utilized in the content are transformed from the original native namespace/prefix
into the in memory NamespaceMap then transformed from the NamespaceMap back into the resultant serialization native
namespace / prefix format.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/NamespaceMap
Name:
NamespaceMap
Instantiability:
Concrete
Properties
Property
Type
minCount
maxCount
namespace
xsd:anyURI
1
1
prefix
xsd:string
1
1
All properties (informative)
Property
Type
minCount
maxCount
namespace
xsd:anyURI
1
1
prefix
xsd:string
1
1
8.1.18
