---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-314-configsourceuri
section_title: "configSourceUri"
section_number: null
pages: 171-171
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Property that describes the URI of the build configuration source file.
Description
If a build configuration exists for the toolchain or platform performing the build, the configSourceUri of a build is the URI of that
build configuration, according to the buildType.
For example, a build triggered by a GitHub Action is defined by a build configuration YAML file. In this case, the configSourceUri
is the URL of that YAML file.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/configSourceUri
Name:
configSourceUri
Nature:
DataProperty
Range:
xsd:anyURI
Referenced
• /Build/Build
16.2.8
