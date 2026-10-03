---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-315-environment
section_title: "environment"
section_number: null
pages: 171-171
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Property describing the session in which a build is invoked.
Description
environment is a map of environment variables and values that are set during a build session, according to the buildType.
This is different from the parameter131 property in that it describes the environment variables set before a build is invoked rather
than the variables provided to the builder.
Metadata
https://spdx.org/rdf/3.0.1/terms/Build/environment
Name:
environment
Nature:
ObjectProperty
Range:
/Core/DictionaryEntry
