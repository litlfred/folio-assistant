---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-024-extension-profile-compliance-point
section_title: "Extension Profile compliance point"
section_number: null
pages: 18-19
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
The Extension Profile captures extended tailored information when producing or consuming non-standard SPDX content in three
ways:
• Support Profile-based extended characterization of Elements. Enables specification and expression of Element characteriza-
tion extensions within any profile and namespace of SPDX without requiring changes to other profiles or namespaces and
without requiring local subclassing of remote classes (which could inhibit ecosystem interoperability in some cases).
• Support extension of SPDX by adopting individuals or communities with Element characterization details uniquely special-
ized to their particular context. Enables adopting individuals or communities to utilize SPDX expressive capabilities along
with expressing more arcane Element characterization details specific to them and not appropriate for standardization across
SPDX.
• Support structured capture of expressive solutions for gaps in SPDX coverage from real-world use. Enables adopting indi-
viduals or communities to express Element characterization details they require that are not currently defined in SPDX but
likely should be. Enables a practical pipeline that identifies gaps in SPDX that should be filled, expresses solutions to those
gaps in a way that allows the identifying adopters to use the extended solutions with SPDX and does not conflict with current
SPDX, can be clearly detected among the SPDX content exchange ecosystem, provides a clear and structured definition of
gap solution that can be used as submission for revision to the SPDX standard.
Software that conforms to the SPDX specification at the Extension Profile compliance point shall be able to import and export
serialized documents that conform with one of the SPDX serialization formats defined SPDX serialization formats, including the
abstract Extension class serving as the base for all defined Extension subclasses.
6
System Package Data Exchange (SPDX©) v3.0
Conformance to the Extension Profile compliance point does not entail support for the Licensing, Security, Dataset, AI, Build, or
profiles of the SPDX but is expected to be used in combination with the other profiles to extend them.
This compliance point facilitates interchange of extended information that goes beyond the standard SPDX produced by tools
supporting SPDX and is used between cooperating parties that understand the form of the extension and can produce and consume
its non-standard content.
5.12
