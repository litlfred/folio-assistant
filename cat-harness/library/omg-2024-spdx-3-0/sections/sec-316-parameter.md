---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-316-parameter
section_title: "parameter"
section_number: null
pages: 171-173
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
System Package Data Exchange (SPDX©) v3.0
159
Referenced
• /Build/Build
16.2.9
parameter
Summary
Property describing a parameter used in an instance of a build.
Description
parameter is a key-value of a build parameter and its value that was provided to the builder for a build instance, according to the
buildType.
This is different from the environment132 property in that the key and value are provided as command line arguments or a config-
uration file to the builder.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/parameter
Name:
parameter
Nature:
ObjectProperty
Range:
/Core/DictionaryEntry
Referenced
• /Build/Build
132environment.md
160
System Package Data Exchange (SPDX©) v3.0
17
