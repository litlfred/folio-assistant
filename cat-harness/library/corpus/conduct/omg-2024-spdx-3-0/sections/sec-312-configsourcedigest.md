---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-312-configsourcedigest
section_title: "configSourceDigest"
section_number: null
pages: 170-170
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Property that describes the digest of the build configuration file used to invoke a build.
Description
configSourceDigest is the checksum of the build configuration file used by a builder to execute a build, according to the buildType.
This Property uses the Core model’s Hash130 class.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/configSourceDigest
Name:
configSourceDigest
Nature:
ObjectProperty
Range:
/Core/Hash
Referenced
• /Build/Build
16.2.6
